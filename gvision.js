// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// sample-metadata:
//   title: Cloud Vision Face Detection
//   description: Identify faces in an image using the Cloud Vision API.
//   usage: node vision-face-detection.js <fileName>
import vision from "@google-cloud/vision";
export default async function detectEmotions(fileName) {
  // [START vision_face_detection]
  // Imports the Google Cloud client library
  //const vision = require('@google-cloud/vision');

  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  function initEmotions() {
    return {
      joy: "",
      anger: "",
      sorrow: "",
      surprise: ""
    };
  }

  async function detectFaces() {
    /**
     * TODO(developer): Uncomment the following line before running the sample.
     */
    // const fileName = 'Local image file, e.g. /path/to/image.png';

    const [result] = await client.faceDetection(fileName);
    const faces = result.faceAnnotations;
    let emotions = initEmotions();

    faces.forEach((face, i) => {
      emotions.joy = face.joyLikelihood;
      emotions.anger = face.angerLikelihood;
      emotions.sorrow = face.sorrowLikelihood;
      emotions.surprise = face.surpriseLikelihood;
    });
    
    let output = "{";
    Object.keys(emotions).forEach((emotion, index) => {
      const acceptedLikelihoods = ["VERY_LIKELY", "LIKELY", "POSSIBLE"];
      const acceptedEmotions = ["joy", "surprise"];

      if (acceptedLikelihoods.includes(emotions[emotion]) && acceptedEmotions.includes(emotion)) {
        output += `"${emotion}": "${emotions[emotion]}",`;
      }
    })
    
    if (output.charAt(output.length - 1) === ",") {
      output = output.substring(0, output.length - 1);
    }

    output += "}";
    return await JSON.parse(output);
  }
  return await detectFaces();
  // [END vision_face_detection]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

// main(...process.argv.slice(2));
