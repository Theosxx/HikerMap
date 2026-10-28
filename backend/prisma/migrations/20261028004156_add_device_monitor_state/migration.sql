-- CreateTable
CREATE TABLE `device_monitor_state` (
    `device_id` VARCHAR(50) NOT NULL,
    `is_offline` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`device_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
