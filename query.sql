-- MySQL Workbench Forward Engineering

-- -----------------------------------------------------
-- Schema sancristobal
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema sancristobal
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sancristobal` DEFAULT CHARACTER SET utf8 ;
USE `sancristobal` ;

-- -----------------------------------------------------
-- Table `sancristobal`.`cliente`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`cliente` (
  `cod_cliente` INT NOT NULL AUTO_INCREMENT,
  `nit` VARCHAR(45) NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `telefono` INT NULL,
  PRIMARY KEY (`cod_cliente`))
ENGINE = InnoDB;

ALTER TABLE `sancristobal`.`cliente` 
CHANGE COLUMN `email` `email` VARCHAR(45) NULL ;

-- -----------------------------------------------------
-- Table `sancristobal`.`unidad_medida`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`unidad_medida` (
  `cod_unidad` INT NOT NULL,
  `medida` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`cod_unidad`))
ENGINE = InnoDB;

ALTER TABLE `sancristobal`.`unidad_medida` 
CHANGE COLUMN `cod_unidad` `cod_unidad` INT NOT NULL AUTO_INCREMENT ;

-- -----------------------------------------------------
-- Table `sancristobal`.`producto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`producto` (
  `cod_producto` INT NOT NULL AUTO_INCREMENT COMMENT 'Llave primaria.',
  `descripcion` VARCHAR(45) NOT NULL COMMENT 'Descripción del producto.',
  `precio_compra` VARCHAR(45) NOT NULL COMMENT 'Precio al que se adquiere el producto.',
  `precio_venta` VARCHAR(45) NOT NULL COMMENT 'Precio al que se vende el producto.',
  `stock` VARCHAR(45) NOT NULL COMMENT 'Cantidad disponible del producto.',
  `estado` TINYINT NOT NULL COMMENT 'Para indicar si el producto está activo o inactivo.',
  `cod_unidad` INT NOT NULL COMMENT 'Especifica si el producto se mide en unidades, libras, quintales, etc.',
  `fecha_registro` DATETIME(6) NOT NULL COMMENT 'Fecha en la que se agregó el producto.',
  `imagen_url` VARCHAR(255) NOT NULL COMMENT 'Para almacenar una URL de imagen del producto, si quieres mostrar imágenes.',
  PRIMARY KEY (`cod_producto`),
  INDEX `fk_producto_unidad_medida1_idx` (`cod_unidad` ASC) VISIBLE,
  CONSTRAINT `fk_producto_unidad_medida1`
    FOREIGN KEY (`cod_unidad`)
    REFERENCES `sancristobal`.`unidad_medida` (`cod_unidad`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

ALTER TABLE producto 
MODIFY COLUMN fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE `sancristobal`.`producto` 
CHANGE COLUMN `precio_compra` `precio_compra` DECIMAL(10,2) NOT NULL COMMENT 'Precio al que se adquiere el producto.' ,
CHANGE COLUMN `precio_venta` `precio_venta` DECIMAL(10,2) NOT NULL COMMENT 'Precio al que se vende el producto.' ;


ALTER TABLE `sancristobal`.`producto` 
CHANGE COLUMN `imagen_url` `imagen_url` VARCHAR(255) NULL COMMENT 'Para almacenar una URL de imagen del producto, si quieres mostrar imágenes.' ;
ALTER TABLE `sancristobal`.`producto` 
CHANGE COLUMN `estado` `estado` TINYINT NULL COMMENT 'Para indicar si el producto está activo o inactivo.' ;

ALTER TABLE `sancristobal`.`producto` 
CHANGE COLUMN `precio_compra` `precio_compra` DECIMAL NOT NULL COMMENT 'Precio al que se adquiere el producto.' ,
CHANGE COLUMN `precio_venta` `precio_venta` DECIMAL NOT NULL COMMENT 'Precio al que se vende el producto.' ,
CHANGE COLUMN `stock` `stock` DECIMAL NOT NULL COMMENT 'Cantidad disponible del producto.' ;

-- -----------------------------------------------------
-- Table `sancristobal`.`credito`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`credito` (
  `cod_credito` INT NOT NULL AUTO_INCREMENT,
  `pagado` TINYINT NOT NULL,
  `fecha_pago` DATE NOT NULL,
  PRIMARY KEY (`cod_credito`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sancristobal`.`prefactura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`prefactura` (
  `cod_factura` VARCHAR(45) NOT NULL,
  `cod_cliente` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `factura` TINYINT NOT NULL,
  `total` DECIMAL(5) NOT NULL,
  -- `cod_credito` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`cod_factura`),
  INDEX `fk_prefactura_cliente1_idx` (`cod_cliente` ASC) VISIBLE,
  -- INDEX `fk_prefactura_credito1_idx` (`cod_credito` ASC) VISIBLE,
  CONSTRAINT `fk_prefactura_cliente1`
    FOREIGN KEY (`cod_cliente`)
    REFERENCES `sancristobal`.`cliente` (`cod_cliente`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
  -- CONSTRAINT `fk_prefactura_credito1`
  --  FOREIGN KEY (`cod_credito`)
  --  REFERENCES `sancristobal`.`credito` (`cod_credito`)
  --  ON DELETE NO ACTION
  --  ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sancristobal`.`detalle_prefactura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`detalle_prefactura` (
  `iddetalle_prefactura` INT NOT NULL,
  `cod_producto` INT NOT NULL,
  `cod_prefactura` VARCHAR(45) NOT NULL,
  `precio` DECIMAL(5) NOT NULL,
  `cantidad` INT NOT NULL,
  `total` INT NOT NULL,
  PRIMARY KEY (`iddetalle_prefactura`),
  INDEX `fk_detalle_prefactura_producto_idx` (`cod_producto` ASC) VISIBLE,
  INDEX `fk_detalle_prefactura_prefactura1_idx` (`cod_prefactura` ASC) VISIBLE,
  CONSTRAINT `fk_detalle_prefactura_producto`
    FOREIGN KEY (`cod_producto`)
    REFERENCES `sancristobal`.`producto` (`cod_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_prefactura_prefactura1`
    FOREIGN KEY (`cod_prefactura`)
    REFERENCES `sancristobal`.`prefactura` (`cod_factura`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

ALTER TABLE `sancristobal`.`detalle_prefactura` 
CHANGE COLUMN `iddetalle_prefactura` `iddetalle_prefactura` INT NOT NULL AUTO_INCREMENT ;

-- -----------------------------------------------------
-- Table `sancristobal`.`movimiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`movimiento` (
  `cod_mov` INT NOT NULL AUTO_INCREMENT,
  `fecha` DATE NOT NULL,
  `total` DECIMAL(5) NOT NULL,
  `credito_cod_credito` INT NOT NULL,
  PRIMARY KEY (`cod_mov`),
  INDEX `fk_movimiento_credito1_idx` (`credito_cod_credito` ASC) VISIBLE,
  CONSTRAINT `fk_movimiento_credito1`
    FOREIGN KEY (`credito_cod_credito`)
    REFERENCES `sancristobal`.`credito` (`cod_credito`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sancristobal`.`detalle_movimiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sancristobal`.`detalle_movimiento` (
  `cod_mov` INT NOT NULL,
  `cod_producto` INT NOT NULL,
  `precio` DECIMAL(5) NOT NULL,
  `cantidad` INT NOT NULL,
  INDEX `fk_movimiento_producto1_idx` (`cod_producto` ASC) VISIBLE,
  INDEX `fk_detalle_movimiento_movimiento1_idx` (`cod_mov` ASC) VISIBLE,
  CONSTRAINT `fk_movimiento_producto1`
    FOREIGN KEY (`cod_producto`)
    REFERENCES `sancristobal`.`producto` (`cod_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_movimiento_movimiento1`
    FOREIGN KEY (`cod_mov`)
    REFERENCES `sancristobal`.`movimiento` (`cod_mov`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


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

ALTER TABLE `sancristobal`.`producto` 
CHANGE COLUMN `estado` `estado` TINYINT NULL DEFAULT 1 COMMENT 'Para indicar si el producto está activo o inactivo.' ;

-- inserts
USE sancristobal;
INSERT INTO `unidad_medida` VALUES (1,'Unidad'),(2,'Bolsa'),(3,'Varilla'),(4,'Metro');
INSERT INTO `producto` VALUES (1,'Tee cpvc 1/2\"',8.00,10.00,50,NULL,1,'2025-03-10 15:32:51',NULL),(2,'Adaptador macho cpvc 1/2\"',8.00,10.00,50,NULL,1,'2025-03-10 15:34:11',NULL),(3,'Codo cpvc 1/2\" 90 grados',8.00,10.00,50,NULL,1,'2025-03-10 15:34:54',NULL),(4,'Codo hg 1/2\" 90 grados',8.00,13.00,50,NULL,1,'2025-03-10 15:37:11',NULL),(5,'Niple hg 1/2\" 30 cm',25.00,30.00,50,NULL,1,'2025-03-10 15:37:57',NULL),(6,'Tubo cpvc 1/2\"',65.00,80.00,50,NULL,1,'2025-03-10 15:38:31',NULL),(7,'Tee pvc 3/4\" 90 grados',3.00,5.00,50,NULL,1,'2025-03-10 17:10:11',NULL),(8,'Adaptador hembra pvc 1/2 lisa',3.00,4.00,50,NULL,1,'2025-03-10 17:19:47',NULL),(9,'	Adaptador hembra pvc 1/2 con rosca',3.00,4.00,50,NULL,1,'2025-03-10 17:20:05',NULL),(10,'Adaptador macho pvc 3/4\"',4.00,5.00,50,NULL,1,'2025-03-10 17:30:25',NULL),(11,'Adaptador macho pvc 1/2\"',2.00,3.50,50,NULL,1,'2025-03-10 17:31:52',NULL),(12,'Codo pvc 3/4\" 90 grados',4.00,5.00,50,NULL,1,'2025-03-10 17:39:14',NULL),(13,'Codo pvc 1/2\" 90 grados',2.50,3.50,50,NULL,1,'2025-03-10 17:39:53',NULL),(14,'Tapón pvc 1/2\" con rosca',2.50,3.50,50,NULL,1,'2025-03-10 17:41:01',NULL),(15,'Reductor pvc 3/4\" a 1/2\"',2.50,3.50,50,NULL,1,'2025-03-10 17:41:51',NULL),(16,'Teflon 3/4\"',3.00,4.00,50,NULL,1,'2025-03-10 17:42:43',NULL),(17,'Tubo pvc 1/2\"',20.00,30.00,50,NULL,1,'2025-03-10 17:44:17',NULL),(18,'Tubo pvc 3/4\"',25.00,32.00,50,NULL,1,'2025-03-10 17:44:42',NULL),(19,'Kit de lavatrastos',50.00,65.00,50,NULL,1,'2025-03-10 17:45:06',NULL),(20,'Contrallave de 1/2\" x 3/8\" para pared',40.00,45.00,50,NULL,1,'2025-03-10 17:45:53',NULL),(21,'Contrallave de 1/2\" x 1/2\" para pared',40.00,45.00,50,NULL,1,'2025-03-10 17:48:43',NULL),(22,'Contrallave de 1/2\" x 3/8\" para piso',40.00,45.00,50,NULL,1,'2025-03-10 17:49:36',NULL),(23,'Manguera de abasto 1/2\" x 1/2\"',20.00,30.00,50,NULL,1,'2025-03-10 17:59:26',NULL),(24,'Manguera de abasto 1/2\" x 3/8\"',25.00,30.00,50,NULL,1,'2025-03-10 18:00:40',NULL),(25,'Manguera de abasto 3/8\" x 7/8\"',20.00,30.00,50,NULL,1,'2025-03-10 18:01:15',NULL),(26,'Codo pvc 2\" 90 grados',10.00,12.00,50,NULL,1,'2025-03-10 18:58:19',NULL),(27,'Yee pvc 3\"',25.00,30.00,50,NULL,1,'2025-03-10 18:59:59',NULL),(28,'Codo pvc 3\" 90 grados',15.00,22.00,50,NULL,1,'2025-03-10 19:01:05',NULL),(29,'Codo pvc 3\" 45 grados',15.00,17.00,50,NULL,1,'2025-03-10 19:02:20',NULL),(30,'Codo pvc 2\" 45 grados',8.00,10.00,50,NULL,1,'2025-03-10 19:02:52',NULL),(31,'Reductor pvc 3\" a 2\"',10.00,13.00,50,NULL,1,'2025-03-10 19:03:57',NULL),(32,'Tubo pvc 2\"',50.00,65.00,50,NULL,1,'2025-03-10 19:04:32',NULL),(33,'Tubo pvc 3\"',75.00,85.00,50,NULL,1,'2025-03-10 19:04:53',NULL),(34,'Pegamento pvc 1/4 Galón',170.00,190.00,50,NULL,1,'2025-03-10 19:05:19',NULL),(35,'Tee pvc 1/2\"',3.00,3.50,50,NULL,1,'2025-03-11 15:54:26',NULL),(36,'Wipe',8.00,10.00,50,NULL,2,'2025-03-11 15:56:07',NULL),(37,'Abrazadera 1/2 media luna',40.00,3.00,50,NULL,1,'2025-03-11 15:58:24',NULL),(38,'Tarugos Tipo Mariposa para tablayeso',0.50,0.90,100,NULL,1,'2025-03-11 15:59:20',NULL);


INSERT INTO `cliente` VALUES (1,'344071-0','INSTITUTO TECNICO DE CAPACITACION Y PRODUCTIVIDAD INTECAP','14 calle 31-30 zona 07 Ciudad de Plata II',NULL,NULL);



-- MODIFICAR ESTADO:

USE `sancristobal`;

-- 1. Deshabilitar temporalmente Safe Update
SET SQL_SAFE_UPDATES = 0;

-- 2. Verificar registros con estado NULL
SELECT COUNT(*) AS productos_sin_estado
FROM `sancristobal`.`producto`
WHERE `estado` IS NULL;

-- 3. Actualizar productos sin estado a Activo
UPDATE `sancristobal`.`producto`
SET `estado` = 1
WHERE `estado` IS NULL;

-- 4. Verificar que no existan valores NULL
SELECT COUNT(*) AS productos_sin_estado
FROM `sancristobal`.`producto`
WHERE `estado` IS NULL;

-- 5. Modificar la columna estado
ALTER TABLE `sancristobal`.`producto`
MODIFY COLUMN `estado` TINYINT NOT NULL DEFAULT 1
COMMENT 'Estado del producto: 1 = Activo, 0 = Inactivo.';

-- 6. Habilitar nuevamente Safe Update
SET SQL_SAFE_UPDATES = 1;