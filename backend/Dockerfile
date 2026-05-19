# syntax=docker/dockerfile:1.7

# Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# dependency:go-offline falla a veces con red inestable ("Premature end of Content-Length"). Reintentos + wagon.
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 bash -euo pipefail -c "\
  for attempt in 1 2 3 4 5; do \
    if mvn -B -ntp -DskipTests \
      -Dmaven.wagon.http.retryHandler.count=10 \
      -Dmaven.wagon.httpconnectionManager.ttlSeconds=180 \
      dependency:go-offline; then \
      exit 0; \
    fi; \
    echo \"[mvn] dependency:go-offline falló (intento $$attempt/5). Reintentando en 15s…\"; \
    sleep 15; \
  done; \
  exit 1"
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests package

# Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
