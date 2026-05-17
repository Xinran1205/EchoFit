FROM docker.m.daocloud.io/library/maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

FROM docker.m.daocloud.io/library/eclipse-temurin:21-jre-jammy
WORKDIR /app

ENV TZ=Asia/Shanghai

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
