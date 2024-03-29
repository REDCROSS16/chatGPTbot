import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { removeFile } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter 
{
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    toMp3 (input, output) {
        let outputPath = resolve(dirname(input), `${output}.mp3` );
        try {
            return new Promise ((resolve, reject) => {
                ffmpeg(input)
                    .inputOption('-t 30')
                    .output(`${output}.mp3`)
                    .on('end', () =>  {
                        removeFile(input);
                        resolve(outputPath); 
                    })
                    .on('error', (err) =>  reject(err.message) )
                    .run();
            })

        } catch (e) {
            console.log('Error file creating mp3', e.message);
        }
    }

    async create(url, filename) {
        const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`);

        try {
            const response = await axios({
                method: 'get',
                url,
                responseType: 'stream',
            });
            return new Promise(resolve =>  {
                const stream = createWriteStream(oggPath);
                response.data.pipe(stream);
                stream.on('finish', () => resolve(oggPath));
            });   
        } catch(e) {
            console.log('Error while creating ogg', e.message);
        }
    }
}

export const ogg = new OggConverter();