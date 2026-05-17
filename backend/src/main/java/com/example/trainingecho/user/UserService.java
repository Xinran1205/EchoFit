package com.example.trainingecho.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.auth.CurrentUser;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public Optional<UserEntity> findByEmail(String email) {
        LambdaQueryWrapper<UserEntity> queryWrapper = new LambdaQueryWrapper<UserEntity>()
            .eq(UserEntity::getEmail, email)
            .eq(UserEntity::getDeleted, 0)
            .last("limit 1");
        return Optional.ofNullable(userMapper.selectOne(queryWrapper));
    }

    public Optional<UserEntity> findActiveById(Long userId) {
        LambdaQueryWrapper<UserEntity> queryWrapper = new LambdaQueryWrapper<UserEntity>()
            .eq(UserEntity::getId, userId)
            .eq(UserEntity::getDeleted, 0)
            .eq(UserEntity::getStatus, 1)
            .last("limit 1");
        return Optional.ofNullable(userMapper.selectOne(queryWrapper));
    }

    public void save(UserEntity user) {
        userMapper.insert(user);
    }

    public CurrentUser toCurrentUser(UserEntity user) {
        return new CurrentUser(
            String.valueOf(user.getId()),
            user.getEmail(),
            user.getNickname()
        );
    }
}
