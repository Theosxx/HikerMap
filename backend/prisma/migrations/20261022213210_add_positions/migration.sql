-- CreateTable
CREATE TABLE `positions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_id` VARCHAR(50) NOT NULL DEFAULT 'gateway-1',
    `counter` INTEGER NOT NULL,
    `status` VARCHAR(10) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `altitude` DOUBLE NOT NULL,
    `satellites` INTEGER NOT NULL,
    `hdop` DOUBLE NOT NULL,
    `rssi` INTEGER NOT NULL,
    `snr` DOUBLE NOT NULL,
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `positions_received_at_idx`(`received_at`),
    UNIQUE INDEX `positions_device_id_counter_key`(`device_id`, `counter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
