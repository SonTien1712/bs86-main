package com.example.backend.core.entity;

import com.example.backend.core.enums.CourtStatus;
import lombok.Data;

@Data
public class Court {

        private Long id;
        private Field field;
        private Integer courtNumber; // 1,2,3,4,5...
        private String status; // ACTIVE, MAINTENANCE

        public Court(){}

        public Court(Long id, Field field, Integer courtNumber, String status) {
                this.id = id;
                this.field = field;
                this.courtNumber = courtNumber;
                this.status = status;
        }

//        public Long getId() {
//                return id;
//        }
//
//        public void setId(Long id) {
//                this.id = id;
//        }
//
//        public String getStatus() {
//                return status;
//        }
//
//        public void setStatus(String status) {
//                this.status = status;
//        }
//
//        public Integer getCourtNumber() {
//                return courtNumber;
//        }
//
//        public void setCourtNumber(Integer courtNumber) {
//                this.courtNumber = courtNumber;
//        }
//
//        public Field getField() {
//                return field;
//        }
//
//        public void setField(Field field) {
//                this.field = field;
//        }
}
