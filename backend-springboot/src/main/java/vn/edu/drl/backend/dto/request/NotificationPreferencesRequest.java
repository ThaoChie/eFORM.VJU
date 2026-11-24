package vn.edu.drl.backend.dto.request;

import lombok.Data;

@Data
public class NotificationPreferencesRequest {
    private Boolean emailRemindersEnabled;
    private Boolean emailClassUpdatesEnabled;
}
