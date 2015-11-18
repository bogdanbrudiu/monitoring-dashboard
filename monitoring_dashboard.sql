CREATE DATABASE IF NOT EXISTS monitoring_dashboard;
 
USE monitoring_dashboard;

CREATE TABLE IF NOT EXISTS `entries` (
`id` INT PRIMARY KEY AUTO_INCREMENT,
`deviceKey` varchar(50) NOT NULL,
`timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP  ON UPDATE CURRENT_TIMESTAMP,
`state` varchar(50) DEFAULT NULL,
`version` varchar(50) DEFAULT NULL,
`battery` varchar(50) DEFAULT NULL,
`rssi` varchar(50) DEFAULT NULL,
);

CREATE TABLE IF NOT EXISTS `devices` (
`deviceKey` varchar(50) PRIMARY KEY, 
`friendlyName` varchar(50) NOT NULL
);