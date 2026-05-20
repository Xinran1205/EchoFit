package com.example.trainingecho.training;

import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TrainingPhotoStorageService {

    private static final Map<String, String> MIME_EXTENSION_MAP = Map.ofEntries(
        Map.entry("image/jpeg", ".jpg"),
        Map.entry("image/png", ".png"),
        Map.entry("image/webp", ".webp"),
        Map.entry("image/gif", ".gif"),
        Map.entry("image/heic", ".heic"),
        Map.entry("image/heif", ".heif")
    );

    private final Path rootPath;

    public TrainingPhotoStorageService(
        @Value("${app.storage.training-photo-root:./data/uploads/training-photos}") String rootPath
    ) {
        this.rootPath = Paths.get(rootPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void ensureRootDirectory() {
        try {
            Files.createDirectories(rootPath);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to initialize training photo storage", exception);
        }
    }

    public StoredPhoto savePhoto(Long userId, Long recordId, Long photoId, MultipartFile file) {
        String extension = resolveExtension(file);
        String storageKey = userId + "/" + recordId + "/" + photoId + extension;
        Path targetPath = resolvePath(storageKey);

        try {
            Files.createDirectories(targetPath.getParent());
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BizException(
                ErrorCode.INTERNAL_ERROR,
                "训练照片保存失败，请稍后重试",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        return new StoredPhoto(
            storageKey,
            normalizeOriginalFilename(file.getOriginalFilename()),
            normalizeContentType(file.getContentType()),
            file.getSize()
        );
    }

    public Path resolvePath(String storageKey) {
        Path resolvedPath = rootPath.resolve(storageKey).normalize();
        if (!resolvedPath.startsWith(rootPath)) {
            throw new BizException(ErrorCode.FORBIDDEN, "非法的照片路径", HttpStatus.FORBIDDEN);
        }
        return resolvedPath;
    }

    public void deleteQuietly(String storageKey) {
        try {
            Files.deleteIfExists(resolvePath(storageKey));
        } catch (IOException ignored) {
            // Best effort cleanup. Metadata delete should not fail because of filesystem residue.
        }
    }

    private String resolveExtension(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            int extensionIndex = originalFilename.lastIndexOf('.');
            if (extensionIndex >= 0 && extensionIndex < originalFilename.length() - 1) {
                String extension = originalFilename.substring(extensionIndex)
                    .toLowerCase(Locale.ROOT)
                    .replaceAll("[^a-z0-9.]", "");
                if (extension.matches("\\.[a-z0-9]{1,10}")) {
                    return extension;
                }
            }
        }
        return MIME_EXTENSION_MAP.getOrDefault(normalizeContentType(file.getContentType()), ".jpg");
    }

    private String normalizeOriginalFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "training-photo";
        }
        return Paths.get(originalFilename).getFileName().toString();
    }

    private String normalizeContentType(String contentType) {
        return contentType == null || contentType.isBlank() ? "application/octet-stream" : contentType;
    }

    public record StoredPhoto(
        String storageKey,
        String originalFilename,
        String contentType,
        long fileSize
    ) {
    }
}
