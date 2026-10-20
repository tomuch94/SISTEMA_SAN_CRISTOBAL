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

