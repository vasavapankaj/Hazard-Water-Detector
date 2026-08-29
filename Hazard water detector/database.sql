CREATE DATABASE water_detector;

USE water_detector;

CREATE TABLE water_data(
    id INT AUTO_INCREMENT PRIMARY KEY,
    tds FLOAT,
    turbidity FLOAT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO water_data(tds,turbidity,status)
VALUES(342,3.8,'SAFE');