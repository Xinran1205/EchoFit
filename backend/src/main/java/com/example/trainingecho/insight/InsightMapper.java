package com.example.trainingecho.insight;

import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface InsightMapper {

    @Select("""
        select count(1)
        from echo_message em
        inner join training_record tr on tr.id = em.related_record_id
        where em.deleted = 0
          and tr.deleted = 0
          and em.user_id = #{userId}
          and em.source = 'future_message'
          and tr.training_date between #{startDate} and #{endDate}
        """)
    long countFutureMessages(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Select("""
        select
          em.id as id,
          tr.training_date as trainingDate,
          em.content as content
        from echo_message em
        inner join training_record tr on tr.id = em.related_record_id
        where em.deleted = 0
          and tr.deleted = 0
          and em.user_id = #{userId}
          and em.source = 'future_message'
          and tr.training_date between #{startDate} and #{endDate}
        order by tr.training_date desc, em.id desc
        limit #{pageSize} offset #{offset}
        """)
    List<InsightEchoExcerptRow> selectFutureMessagePage(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        @Param("offset") long offset,
        @Param("pageSize") int pageSize
    );
}
