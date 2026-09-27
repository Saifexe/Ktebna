package com.ktebna.backend.service;

import com.ktebna.backend.dto.PostForm;
import com.ktebna.backend.dto.PostResponse;
import com.ktebna.backend.entity.Post;
import com.ktebna.backend.entity.PostStatus;
import com.ktebna.backend.entity.User;
import com.ktebna.backend.exception.ApiException;
import com.ktebna.backend.repository.PostRepository;
import com.ktebna.backend.repository.SavedPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.regex.Pattern;

// Listing rules: pricing, pickup pins, ownership and visibility. Returns DTOs so
// no lazy entity leaves the transaction.
@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    // A sale price in Tunisian dinars: up to 6 digits, up to 3 decimals (millimes),
    // optionally already followed by "TND" or "DT". Anything else (another
    // currency, words) is refused rather than guessed.
    private static final Pattern TND_PRICE =
            Pattern.compile("^(\\d{1,6}(?:[.,]\\d{1,3})?)\\s*(?:TND|DT)?$", Pattern.CASE_INSENSITIVE);

    private final PostRepository postRepository;
    private final SavedPostRepository savedPostRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public Page<PostResponse> feed(String category, String dealType, String location,
                                   String search, Pageable pageable) {
        return postRepository.findPublicFeed(filter(category), filter(dealType), filter(location),
                        searchTerm(search), pageable)
                .map(PostResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> mine(User owner, Pageable pageable) {
        return postRepository.findByUserIdOrderByCreatedAtDescIdDesc(owner.getId(), pageable)
                .map(PostResponse::from);
    }

    // Hidden listings are visible to their owner only; everyone else gets the
    // same 404 as for a missing post, so ids can't be probed.
    @Transactional(readOnly = true)
    public PostResponse getVisible(User viewer, Long id) {
        Post post = find(id);
        if (!post.isPublic() && !isOwner(viewer, post)) {
            throw notFound();
        }
        return PostResponse.from(post);
    }

    public PostResponse create(User owner, PostForm form) {
        Post post = new Post();
        post.setUser(owner);
        post.setPublic(form.getIsPublic() == null || form.getIsPublic());
        apply(post, form);
        return PostResponse.from(postRepository.save(post));
    }

    public PostResponse update(User owner, Long id, PostForm form) {
        Post post = findOwned(owner, id);
        if (form.getIsPublic() != null) {
            post.setPublic(form.getIsPublic());
        }
        apply(post, form);
        return PostResponse.from(postRepository.save(post));
    }

    public PostResponse setVisibility(User owner, Long id, boolean isPublic) {
        Post post = findOwned(owner, id);
        post.setPublic(isPublic);
        return PostResponse.from(postRepository.save(post));
    }

    // Available / reserved / sold. Only the owner decides where a deal stands.
    public PostResponse setStatus(User owner, Long id, PostStatus status) {
        Post post = findOwned(owner, id);
        post.setStatus(status);
        return PostResponse.from(postRepository.save(post));
    }

    public void delete(User owner, Long id) {
        Post post = findOwned(owner, id);
        // Other readers' bookmarks reference the post; drop them first.
        savedPostRepository.deleteAllForPost(post.getId());
        postRepository.delete(post);
        fileStorageService.deleteLater(post.getBookImage());
    }

    // Shared by create and update: copy the form, store a new image if one was
    // sent. The replaced file is only removed once the transaction commits.
    private void apply(Post post, PostForm form) {
        post.setBookName(form.getBookName());
        post.setBookAuthor(form.getBookAuthor());
        post.setBookCategory(form.getBookCategory());
        post.setBookDeal(normalizeDeal(form.getBookDealType(), form.getBookDeal()));
        post.setBookDealType(form.getBookDealType());
        post.setBookLocation(form.getBookLocation());
        post.setBookCondition(form.getBookCondition());
        post.setBookDescription(form.getBookDescription());
        applyPickup(post, form.getPickupLat(), form.getPickupLng(), form.getPickupSpot());

        MultipartFile image = form.getImage();
        if (image != null && !image.isEmpty()) {
            String replaced = post.getBookImage();
            post.setBookImage(fileStorageService.store(image));
            fileStorageService.deleteLater(replaced);
        }
    }

    private Post find(Long id) {
        return postRepository.findById(id).orElseThrow(PostService::notFound);
    }

    private Post findOwned(User owner, Long id) {
        Post post = find(id);
        if (!isOwner(owner, post)) {
            throw new ApiException("You do not own this post", HttpStatus.FORBIDDEN);
        }
        return post;
    }

    private static boolean isOwner(User user, Post post) {
        return user != null && post.getUser().getId().equals(user.getId());
    }

    private static ApiException notFound() {
        return new ApiException("Post not found", HttpStatus.NOT_FOUND);
    }

    // Search is a plain substring match: escape LIKE's wildcards (the feed query
    // declares '!' as its escape character) so "50%" means the text "50%".
    private static String searchTerm(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim().replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }

    // The frontend sends "All" / "allTunisia" for "no filter".
    private static String filter(String s) {
        return s == null || s.isBlank() || s.equalsIgnoreCase("All") || s.equalsIgnoreCase("allTunisia")
                ? null : s;
    }

    // Sales are always priced in TND and stored as "<amount> TND". Swaps keep
    // their free-text wish ("any YA novel"), gifts have no price.
    private static String normalizeDeal(String dealType, String deal) {
        if (!"sell".equalsIgnoreCase(dealType)) {
            return deal;
        }
        var match = deal == null ? null : TND_PRICE.matcher(deal.trim());
        if (match == null || !match.matches()) {
            throw new ApiException("Enter the price as a number of Tunisian dinars (TND)", HttpStatus.BAD_REQUEST);
        }
        BigDecimal amount = new BigDecimal(match.group(1).replace(',', '.'));
        if (amount.signum() <= 0) {
            throw new ApiException("The price must be more than 0 TND", HttpStatus.BAD_REQUEST);
        }
        return amount.stripTrailingZeros().toPlainString() + " TND";
    }

    // A pin needs both coordinates inside valid ranges; otherwise it is cleared.
    private static void applyPickup(Post post, Double lat, Double lng, String spot) {
        boolean valid = lat != null && lng != null
                && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        String trimmed = spot == null ? "" : spot.trim();
        post.setPickupLat(valid ? lat : null);
        post.setPickupLng(valid ? lng : null);
        post.setPickupSpot(valid && !trimmed.isEmpty()
                ? trimmed.substring(0, Math.min(trimmed.length(), 200)) : null);
    }
}
