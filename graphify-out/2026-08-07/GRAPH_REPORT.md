# Graph Report - .  (2026-08-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 419 nodes · 952 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4286fffd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Home.jsx
- User
- lombok.Getter
- ApiException
- dependencies
- devDependencies
- Books.jsx
- Conversation
- SecurityConfig.java
- JwtAuthFilter.java
- GlobalExceptionHandler.java
- KtebnaBackendApplication
- MessageList.jsx
- sorts.js
- com.ktebna:backend

## God Nodes (most connected - your core abstractions)
1. `User` - 45 edges
2. `ApiException` - 24 edges
3. `UserDto` - 20 edges
4. `Conversation` - 20 edges
5. `Post` - 20 edges
6. `PostController` - 17 edges
7. `SavedPost` - 17 edges
8. `Message` - 16 edges
9. `PostResponse` - 13 edges
10. `UserRepository` - 13 edges

## Surprising Connections (you probably didn't know these)
- `SecurityConfig` --references--> `JwtAuthFilter`  [EXTRACTED]
  backend/src/main/java/com/ktebna/backend/config/SecurityConfig.java → backend/src/main/java/com/ktebna/backend/security/JwtAuthFilter.java
- `AuthController` --references--> `JwtUtil`  [EXTRACTED]
  backend/src/main/java/com/ktebna/backend/controller/AuthController.java → backend/src/main/java/com/ktebna/backend/security/JwtUtil.java
- `MessageController` --references--> `ConversationRepository`  [EXTRACTED]
  backend/src/main/java/com/ktebna/backend/controller/MessageController.java → backend/src/main/java/com/ktebna/backend/repository/ConversationRepository.java
- `MessageController` --references--> `MessageRepository`  [EXTRACTED]
  backend/src/main/java/com/ktebna/backend/controller/MessageController.java → backend/src/main/java/com/ktebna/backend/repository/MessageRepository.java
- `PostController` --references--> `FileStorageService`  [EXTRACTED]
  backend/src/main/java/com/ktebna/backend/controller/PostController.java → backend/src/main/java/com/ktebna/backend/service/FileStorageService.java

## Import Cycles
- None detected.

## Communities (19 total, 4 thin omitted)

### Community 0 - "Home.jsx"
Cohesion: 0.06
Nodes (47): Account(), AddPostModal(), DeletePostModal(), DeleteUserModal(), UpdatePostModal(), UpdateProfilePictureModal(), Sidebar(), UserConversations() (+39 more)

### Community 1 - "User"
Cohesion: 0.06
Nodes (33): DeleteMapping, GetMapping, PostMapping, PutMapping, RequestMapping, RestController, PostController, DeleteMapping (+25 more)

### Community 2 - "lombok.Getter"
Cohesion: 0.10
Nodes (24): GetMapping, PostMapping, PutMapping, AuthResponse, ErrorResponse, LoginRequest, MessageResponse, PostRequest (+16 more)

### Community 3 - "ApiException"
Cohesion: 0.09
Nodes (22): AuthController, GetMapping, PostMapping, RequestMapping, RestController, RequestMapping, RestController, MessageController (+14 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (37): axios, @emotion/react, @emotion/styled, framer-motion, i18next, i18next-browser-languagedetector, dependencies, axios (+29 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (28): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+20 more)

### Community 6 - "Books.jsx"
Cohesion: 0.11
Nodes (14): Book(), Books(), BooksFilterPanel(), BooksHeader(), BooksList(), useBookFilters(), useFilteredBooks(), booksData (+6 more)

### Community 7 - "Conversation"
Cohesion: 0.19
Nodes (11): ConversationController, GetMapping, RequestMapping, RestController, ConversationResponse, Conversation, Entity, PrePersist (+3 more)

### Community 8 - "SecurityConfig.java"
Cohesion: 0.21
Nodes (11): SecurityConfig, Override, WebConfig, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration, org.springframework.security.config.annotation.web.builders.HttpSecurity, org.springframework.security.crypto.password.PasswordEncoder, org.springframework.security.web.SecurityFilterChain (+3 more)

### Community 9 - "JwtAuthFilter.java"
Cohesion: 0.26
Nodes (9): Override, JwtAuthFilter, JwtUtil, jakarta.servlet.FilterChain, jakarta.servlet.http.HttpServletRequest, jakarta.servlet.http.HttpServletResponse, javax.crypto.SecretKey, org.springframework.stereotype.Component (+1 more)

### Community 10 - "GlobalExceptionHandler.java"
Cohesion: 0.40
Nodes (6): GlobalExceptionHandler, org.springframework.http.ResponseEntity, org.springframework.security.access.AccessDeniedException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException

## Knowledge Gaps
- **45 isolated node(s):** `com.ktebna:backend`, `name`, `private`, `version`, `type` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `JwtAuthFilter.java`, `lombok.Getter`, `ApiException`, `Conversation`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `ApiException` connect `ApiException` to `User`, `lombok.Getter`, `Conversation`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Post` connect `User` to `lombok.Getter`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `com.ktebna:backend`, `name`, `private` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Home.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05640203154236835 - nodes in this community are weakly interconnected._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.06398809523809523 - nodes in this community are weakly interconnected._
- **Should `lombok.Getter` be split into smaller, more focused modules?**
  _Cohesion score 0.10431372549019607 - nodes in this community are weakly interconnected._