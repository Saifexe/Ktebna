# --- Build stage ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B
# Split the jar into Spring Boot's layers: libraries rarely change, our code
# does. Each becomes its own image layer, so a new commit only adds the small
# application layer to the registry instead of the whole 65 MB jar.
RUN java -Djarmode=tools -jar target/backend.jar extract --layers --launcher --destination target/extracted

# --- Run stage ---
# Alpine JRE: about half the size of the Ubuntu-based one.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Pull Alpine security fixes released after the base image was built
# (e.g. libexpat CVE-2026-93990, fixed in 2.8.5-r0), as the frontend image does.
# Then run as an unprivileged user; only the uploads directory is writable by it.
RUN apk upgrade --no-cache \
    && addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app -s /sbin/nologin app \
    && mkdir -p /app/uploads \
    && chown app:app /app/uploads
# Least to most frequently changing, so unchanged layers are reused.
COPY --from=build /app/target/extracted/dependencies/ ./
COPY --from=build /app/target/extracted/spring-boot-loader/ ./
COPY --from=build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /app/target/extracted/application/ ./
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
