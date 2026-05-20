package com.example.trainingecho.training;

import com.example.trainingecho.auth.SecurityUtils;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/training-record-photos")
public class TrainingPhotoController {

    private final TrainingRecordService trainingRecordService;

    public TrainingPhotoController(TrainingRecordService trainingRecordService) {
        this.trainingRecordService = trainingRecordService;
    }

    @GetMapping("/{photoId}/file")
    public ResponseEntity<Resource> getPhotoFile(@PathVariable String photoId) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        TrainingRecordService.PhotoFilePayload payload = trainingRecordService.loadPhotoPayload(userId, photoId);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            mediaType = MediaType.parseMediaType(payload.mimeType());
        } catch (Exception ignored) {
            // Fall back to octet-stream when the stored type is malformed.
        }

        ContentDisposition contentDisposition = ContentDisposition.inline()
            .filename(payload.originalFilename(), StandardCharsets.UTF_8)
            .build();

        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .contentType(mediaType)
            .contentLength(payload.fileSize() != null ? payload.fileSize() : 0L)
            .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
            .body(new FileSystemResource(payload.filePath()));
    }
}
