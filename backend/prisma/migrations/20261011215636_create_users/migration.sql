-- AlterTable
ALTER TABLE `Hiker`
MODIFY `address` VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Hiker_name_key`
ON `Hiker`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `Hiker_address_key`
ON `Hiker`(`address`);