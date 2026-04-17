import * as winston from "winston";
import DailyRotateFile from 'winston-daily-rotate-file'
const  {combine, label, colorize, prettyPrint, timestamp, align, printf } = winston.format
const timezoned = () => {
	return new Date().toLocaleString("es", {
		timeZone: "America/Tegucigalpa",
	});
};

const logFormat = combine(
	label({ label: "Datos:", message: true }),
	colorize(),
	prettyPrint(),
	timestamp({ format: timezoned }),
	align(),
	printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transport = new DailyRotateFile({
	filename: "recordtvc-%DATE%.log",
	dirname: "./logs",
	frequency: "24h",
	zippedArchive: true,
	maxSize: "20m",
	maxFiles: "14d",
	prepend: true,
	level: "info",
});

transport.on("rotate", function (oldFilename, newFilename) {
	// call function like upload to s3 or on cloud
});

export const logger = winston.createLogger({
	format: logFormat,
	transports: [
		transport,
		new winston.transports.Console({
			level: "info",
		}),
	],
});