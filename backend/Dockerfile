FROM docker.m.daocloud.io/library/maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn ./.mvn
RUN --mount=type=cache,target=/root/.m2 sh -c '\
  for i in 1 2 3; do \
    mvn -s .mvn/settings-docker.xml -q -DskipTests dependency:go-offline && exit 0; \
    echo "Maven dependency warmup failed, retry $i/3"; \
    sleep 5; \
  done; \
  exit 1'

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 sh -c '\
  for i in 1 2 3; do \
    mvn -s .mvn/settings-docker.xml -q -DskipTests package && exit 0; \
    echo "Maven package failed, retry $i/3"; \
    sleep 5; \
  done; \
  exit 1'

FROM docker.m.daocloud.io/library/eclipse-temurin:21-jre-jammy
WORKDIR /app

ENV TZ=Asia/Shanghai

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
