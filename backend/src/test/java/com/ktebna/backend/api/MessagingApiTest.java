package com.ktebna.backend.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MessagingApiTest extends ApiTestBase {

    private JsonNode send(Account from, Account to, String book, String text) throws Exception {
        return body(mvc.perform(jsonBody(as(from, post("/api/messages")),
                        book == null
                                ? Map.of("otherUserId", to.id(), "messageContent", text)
                                : Map.of("otherUserId", to.id(), "bookName", book, "messageContent", text)))
                .andExpect(status().isOk()));
    }

    private long unreadTotal(Account account) throws Exception {
        return body(mvc.perform(as(account, get("/api/conversations/unread")))).path("total").asLong();
    }

    @Test
    void firstMessageCreatesTheConversationAndNotifiesTheRecipient() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");

        JsonNode sent = send(buyer, seller, "Dune", "Is Dune still available?");
        long conversationId = sent.path("conversation").path("id").asLong();

        assertThat(sent.path("conversation").path("conversationTopic").asText()).isEqualTo("Dune");
        mvc.perform(as(seller, get("/api/conversations")))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].lastMessageContent").value("Is Dune still available?"));
        mvc.perform(as(seller, get("/api/conversations/" + conversationId + "/messages")))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].userId").value(buyer.id()));
        verify(emailNotificationService).sendNotification(eq(seller.email()), anyString(), eq("Buyer"),
                eq("Is Dune still available?"), eq("Dune"));
    }

    @Test
    void unreadCountsGoUpAndClearWhenTheChatIsRead() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");

        long conversationId = send(buyer, seller, "Atomic Habits", "Hi!").path("conversation").path("id").asLong();
        send(buyer, seller, null, "Still interested");
        send(buyer, seller, null, "Can we meet Saturday?");

        JsonNode unread = body(mvc.perform(as(seller, get("/api/conversations/unread"))));
        assertThat(unread.path("total").asLong()).isEqualTo(3);
        assertThat(unread.path("conversations").get(0).path("otherUser").path("name").asText()).isEqualTo("Buyer");
        assertThat(unread.path("conversations").get(0).path("otherUser").path("email").isNull()).isTrue();
        assertThat(unreadTotal(buyer)).isZero(); // your own messages are never unread

        mvc.perform(as(seller, post("/api/conversations/" + conversationId + "/read"))).andExpect(status().isOk());
        assertThat(unreadTotal(seller)).isZero();

        send(buyer, seller, null, "One more thing");
        assertThat(unreadTotal(seller)).isEqualTo(1);
    }

    @Test
    void replyingMarksEarlierMessagesAsRead() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");
        send(buyer, seller, "Fangirl", "Hello");
        send(buyer, seller, null, "Hello again");

        send(seller, buyer, null, "Hi, yes it's available");

        assertThat(unreadTotal(seller)).isZero();
        assertThat(unreadTotal(buyer)).isEqualTo(1);
    }

    @Test
    void outsidersCannotReadOrMarkAConversation() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");
        Account snoop = register("Snoop");
        long conversationId = send(buyer, seller, "Dune", "Private question").path("conversation").path("id").asLong();

        mvc.perform(as(snoop, get("/api/conversations/" + conversationId + "/messages"))).andExpect(status().isForbidden());
        mvc.perform(as(snoop, get("/api/conversations/" + conversationId))).andExpect(status().isForbidden());
        mvc.perform(as(snoop, post("/api/conversations/" + conversationId + "/read"))).andExpect(status().isForbidden());
    }

    @Test
    void conversationsDoNotExposeEmailAddresses() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");
        send(buyer, seller, "Dune", "Hi");

        String list = mvc.perform(as(seller, get("/api/conversations"))).andReturn().getResponse().getContentAsString();

        assertThat(list).doesNotContain(buyer.email()).doesNotContain(seller.email());
    }

    @Test
    void messagingRequiresLoginAndContent() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");

        mvc.perform(jsonBody(post("/api/messages"), Map.of("otherUserId", seller.id(), "messageContent", "hi")))
                .andExpect(status().isUnauthorized());
        mvc.perform(jsonBody(as(buyer, post("/api/messages")), Map.of("otherUserId", seller.id(), "messageContent", " ")))
                .andExpect(status().isBadRequest());
        mvc.perform(jsonBody(as(buyer, post("/api/messages")), Map.of("otherUserId", 999_999_999, "messageContent", "hi")))
                .andExpect(status().isNotFound());
    }

    @Test
    void youCannotMessageYourself() throws Exception {
        Account loner = register("Loner");
        mvc.perform(jsonBody(as(loner, post("/api/messages")),
                        Map.of("otherUserId", loner.id(), "messageContent", "Hello me")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void overlongMessagesAreA400AndLongOnesKeepAShortPreview() throws Exception {
        Account buyer = register("Buyer");
        Account seller = register("Seller");
        mvc.perform(jsonBody(as(buyer, post("/api/messages")),
                        Map.of("otherUserId", seller.id(), "messageContent", "x".repeat(2001))))
                .andExpect(status().isBadRequest());

        // 1500 characters fit the message column (2000) but not the preview column (1000).
        JsonNode sent = send(buyer, seller, "Dune", "y".repeat(1500));
        assertThat(sent.path("message").path("messageContent").asText()).hasSize(1500);
        assertThat(sent.path("conversation").path("lastMessageContent").asText()).hasSize(1000).endsWith("…");
    }

    @Test
    void bothUsersWritingFirstStillShareOneConversation() throws Exception {
        Account a = register("Alice");
        Account b = register("Bob");
        long first = send(a, b, "Dune", "Hi Bob").path("conversation").path("id").asLong();
        long second = send(b, a, "Dune", "Hi Alice").path("conversation").path("id").asLong();
        assertThat(second).isEqualTo(first);
    }
}
