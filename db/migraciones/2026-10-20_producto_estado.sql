-- -----------------------------------------------------
-- Estado del producto: 1 = Activo, 0 = Inactivo
-- Hasta ahora el alta de productos no asignaba estado (quedaba NULL).
-- Ejecutar una sola vez (MySQL Workbench o cliente mysql).
-- -----------------------------------------------------
USE `sancristobal`;

-- 1. Productos sin estado se consideran activos
UPDATE `sancristobal`.`producto`
   SET `estado` = 1
 WHERE `estado` IS NULL;

-- 2. El estado pasa a ser obligatorio, con valor por defecto Activo
ALTER TABLE `sancristobal`.`producto`
  CHANGE COLUMN `estado` `estado` TINYINT NOT NULL DEFAULT 1 COMMENT 'Estado del producto: 1 = Activo, 0 = Inactivo.';
