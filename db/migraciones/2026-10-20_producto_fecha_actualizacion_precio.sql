-- -----------------------------------------------------
-- Fecha de la última actualización de precio en `producto`
-- Permite generar el reporte de productos que no han actualizado su precio.
-- Ejecutar una sola vez (MySQL Workbench o cliente mysql).
-- -----------------------------------------------------
USE `sancristobal`;

-- 1. Nuevo campo: al insertar un producto toma la fecha actual
ALTER TABLE `sancristobal`.`producto`
  ADD COLUMN `fecha_actualizacion_precio` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `fecha_registro`;

-- 2. Productos existentes: se toma su fecha de registro como última actualización conocida
UPDATE `sancristobal`.`producto`
   SET `fecha_actualizacion_precio` = COALESCE(`fecha_registro`, NOW());

-- 3. Índice para filtrar y ordenar el reporte por fecha
ALTER TABLE `sancristobal`.`producto`
  ADD INDEX `idx_producto_fecha_actualizacion_precio` (`fecha_actualizacion_precio` ASC);

-- 4. Trigger: actualiza la fecha solo cuando cambia el precio de compra o de venta
--    (editar descripción, stock o unidad no cuenta como actualización de precio)
DROP TRIGGER IF EXISTS `sancristobal`.`trg_producto_fecha_precio`;

DELIMITER $$
CREATE TRIGGER `sancristobal`.`trg_producto_fecha_precio`
BEFORE UPDATE ON `sancristobal`.`producto`
FOR EACH ROW
BEGIN
  IF NOT (NEW.precio_venta <=> OLD.precio_venta) OR NOT (NEW.precio_compra <=> OLD.precio_compra) THEN
    SET NEW.fecha_actualizacion_precio = NOW();
  END IF;
END$$
DELIMITER ;
