// Example taken from https://cloud.google.com/healthcare-api/docs/how-tos/dicomweb#retrieving_a_study
// and modified to parse multipart data.
const multi = require("./multipart");
const google = require("@googleapis/healthcare");
const healthcare = google.healthcare({
  version: "v1",
  auth: new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  }),
});
const fs = require("fs").promises;
// Specify the template for the multipart output DICOM files.
const fileName = "study_file.multipart";

const dicomWebRetrieveStudy = async () => {
  const cloudRegion = "";
  const projectId = "";
  const datasetId = "";
  const dicomStoreId = "";
  const studyUid = "";
  const parent = `projects/${projectId}/locations/${cloudRegion}/datasets/${datasetId}/dicomStores/${dicomStoreId}`;
  const dicomWebPath = `studies/${studyUid}`;
  const request = { parent, dicomWebPath };

  console.log("Retrieving study as multipart..");
  let study;
  try {
    study =
      await healthcare.projects.locations.datasets.dicomStores.studies.retrieveStudy(
        request,
        {
          headers: {
            Accept:
              "multipart/related; type=application/dicom; transfer-syntax=*",
          },
          responseType: "arraybuffer",
        }
      );
  } catch (e) {
    console.error(
      `ERROR: Code: ${e.response.status}, Text: ${e.response.statusText}`
    );
    process.exit(1);
  }

  console.log("Parsing multipart..");
  const fileBytes = Buffer.from(study.data);
  const boundary = multi.getBoundary(study.headers["content-type"]);
  const parts = multi.parse(fileBytes, boundary);
  const promises = [];

  console.log("Writing file parts..");
  for (let i = 0; i < parts.length; ++i) {
    const buffer = parts[i].data;
    const dcmFileName = `${fileName}.${i}.dcm`;
    // Writes file(s) to default directory.
    promises.push(fs.writeFile(dcmFileName, buffer));
  }

  await Promise.all(promises);
  console.log("Done");
};

dicomWebRetrieveStudy();
