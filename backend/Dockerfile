# --- Build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Run stage ---
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Run as an unprivileged user; only the uploads directory is writable by it.
RUN groupadd --system --gid 10001 app \
    && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app \
    && mkdir -p /app/uploads \
    && chown app:app /app/uploads
COPY --from=build /app/target/backend.jar app.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
