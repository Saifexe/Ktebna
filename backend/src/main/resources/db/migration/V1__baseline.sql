-- V1: baseline of the schema first created by Hibernate ddl-auto=update.
-- Existing databases are baselined at this version and skip it.
-- Table order respects foreign keys.

CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_picture` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_topic` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `last_message_content` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_message_sender` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `first_user_id` bigint NOT NULL,
  `second_user_id` bigint NOT NULL,
  `first_user_last_read_id` bigint DEFAULT NULL,
  `second_user_last_read_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conversation_pair` (`first_user_id`,`second_user_id`),
  KEY `FKl58w6gdnu74wpsfl0lb97jex4` (`second_user_id`),
  CONSTRAINT `FKfu0yhnkm6n7helt2y11hdx355` FOREIGN KEY (`first_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKl58w6gdnu74wpsfl0lb97jex4` FOREIGN KEY (`second_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `library_books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `author` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pdf_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK874tk2iadm3iq1d4mtd1rjoiq` (`user_id`),
  CONSTRAINT `FK874tk2iadm3iq1d4mtd1rjoiq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `message_content` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversation_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKt492th6wsovh1nush5yl5jj8e` (`conversation_id`),
  KEY `FKpsmh6clh3csorw43eaodlqvkn` (`user_id`),
  CONSTRAINT `FKpsmh6clh3csorw43eaodlqvkn` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKt492th6wsovh1nush5yl5jj8e` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_deal` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_deal_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_public` bit(1) NOT NULL,
  `user_id` bigint NOT NULL,
  `book_author` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_condition` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_description` varchar(2000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_lat` double DEFAULT NULL,
  `pickup_lng` double DEFAULT NULL,
  `pickup_spot` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  PRIMARY KEY (`id`),
  KEY `FK5lidm6cqbc7u4xhqpxm898qme` (`user_id`),
  CONSTRAINT `FK5lidm6cqbc7u4xhqpxm898qme` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `posts_chk_1` CHECK ((`status` in ('AVAILABLE','RESERVED','SOLD')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `saved_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `post_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKrp4caf9aruyad4113wv29bowp` (`user_id`,`post_id`),
  KEY `FK9poxgdc1595vxdxkyg202x4ge` (`post_id`),
  CONSTRAINT `FK9poxgdc1595vxdxkyg202x4ge` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKs9a5ulcshnympbu557ps3qdlv` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
