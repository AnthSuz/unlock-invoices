import React, { useEffect, useState } from "react";
import "./App.css";
import { useCSVReader } from "react-papaparse";
import { exportToExcel } from "react-json-to-excel";

import filelogo from "./img/filelogo.png";
import unlocklogo from "./img/unlocklogo.png";

import { cn } from "./lib/utils.ts";
import GridPattern from "./components/magicui/grid-pattern.tsx";

const GREY = "#CCC";
const GREY_LIGHT = "rgba(255, 255, 255, 0.4)";
const DEFAULT_REMOVE_HOVER_COLOR = "#000000";
const REMOVE_HOVER_COLOR_LIGHT = "#848484";

const styles = {
  unlockLogo: {
    maxWidth: "50%",
  },
  zone: {
    alignItems: "center",
    border: `2px dashed ${GREY}`,
    borderRadius: 20,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
    padding: 60,
    cursor: "pointer",
  },
  file: {
    display: "flex",
    position: "relative",
    zIndex: 10,
    flexDirection: "column",
    justifyContent: "center",
  },
  info: {
    display: "flex",
    alignItems: "center",
  },
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
    marginTop: "0.5em",
    marginBottom: "0.5em",
    padding: 4,
  },
  zoneHover: {
    borderColor: { GREY },
  },
  default: {
    borderColor: { GREY },
  },
  remove: {
    height: 23,
    position: "absolute",
    top: -10,
    width: 23,
  },
  filelogo: {
    height: 50,
  },
  arrowLogo: {
    height: "60px",
    marginLeft: "30px",
    marginRight: "30px",
  },
  csvFile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};

const BASE_HORRAIRE = 35;

function App() {
  const { CSVReader } = useCSVReader();
  const [nameFile, setNameFile] = useState("");
  const [zoneHover, setZoneHover] = useState(false);
  const [sortData, setSortData] = useState([]);
  const [fileIsGenerated, setFileIsGenerated] = useState(false);
  const [backgroundArray, setBackgroundArray] = useState([]);
  const [removeHoverColor, setRemoveHoverColor] = useState(
    DEFAULT_REMOVE_HOVER_COLOR
  );

  const getPrice = (time, nbParticipate, type, canceled) => {
    const obj = {
      PISTE: 11,
      TATAMI: 20,
    };

    if (canceled) {
      return 0;
    } else if (
      type === "RACK" ||
      type === "RING" ||
      !nbParticipate ||
      nbParticipate < obj[type]
    ) {
      return time * BASE_HORRAIRE;
    } else {
      return (BASE_HORRAIRE + (nbParticipate - obj[type])) * time;
    }
  };

  const parseDate = (str) => {
    let parts = str.split(" ");
    let dateParts = parts[0].split("/");
    let timeParts = parts[1].split(":");

    return new Date(
      dateParts[2],
      dateParts[1] - 1,
      dateParts[0],
      timeParts[0],
      timeParts[1],
      timeParts[2]
    );
  };

  const sortInfo = (data) => {
    if (!data["Date de début du cours"]) return;
    const date1 = parseDate(data["Date de début du cours"]);
    const date2 = parseDate(data["Date de fin du cours"]);

    const differenceInMs = date2 - date1;

    let differenceInHours = differenceInMs / (1000 * 60 * 60);
    return {
      "Date du cours": data["Date de début du cours"].split(" ")[0],
      Horraire: `${data["Date de début du cours"].split(" ")[1]} - ${
        data["Date de fin du cours"].split(" ")[1]
      }`,
      Durée: differenceInHours,
      Cours: data["Activité"],
      Espace: data["Nom du Studio"],
      "Nombre de personne": !data["Nombre total de réservation"]
        ? 0
        : parseInt(data["Nombre total de réservation"]),
      Total: getPrice(
        differenceInHours,
        parseInt(data["Nombre total de réservation"]),
        data["Nom du Studio"].toUpperCase(),
        !(data["Supprimé le"] === "")
      ),
      Info: !(data["Supprimé le"] === "") ? "Cours annulé" : "",
    };
  };

  const generateBackground = (min, max) => {
    function getRandomNumber(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }

    let mainArray = [];

    for (let i = 0; i < 20; i++) {
      let subArray = [getRandomNumber(min, max), getRandomNumber(min, max)];
      mainArray.push(subArray);
    }

    setBackgroundArray(mainArray);
  };

  useEffect(() => {
    generateBackground(1, 20);
  }, []);

  const calculeTotalMonth = () => {
    const copySortData = [...sortData];

    sortData.forEach((test, index) => {
      if (test.sheetName === undefined) return;
      if (test.sheetName === "") {
        test.sheetName = "Coach non renseigné";
      }
      const total = sortData[index].details.reduce((a, b) => a + b["Total"], 0);

      copySortData[index].details.push({
        "": "Total :",
        " ": total,
      });
    });

    if (copySortData[copySortData.length - 1].sheetName === undefined) {
      copySortData.pop();
    }

    setSortData(copySortData);
    setFileIsGenerated(true);
  };

  return (
    <div className="App">
      <div className="relative flex h-full w-full max-w-[32rem] items-center justify-center overflow-hidden rounded-lg border bg-white p-8 md:shadow-xl ">
        <div className="body">
          <img src={unlocklogo} alt="unlock" style={styles.unlockLogo} />
          <CSVReader
            config={{
              header: true,
            }}
            onUploadAccepted={(results) => {
              const clearData = JSON.parse(
                JSON.stringify(results.data).replace(/[\uFFFD]/g, "é")
              );

              const sortByCoach = clearData.reduce((curr, acc) => {
                const isMMACompetition = acc["Activité"] === "MMA COMPETITION";
                const coachName =
                  isMMACompetition && acc["Prénom du coach"] === ""
                    ? "MMA COMPETITION"
                    : acc["Prénom du coach"];

                let coachIndex = curr.findIndex(
                  (coach) => coach.sheetName === coachName
                );

                if (coachIndex === -1) {
                  curr.push({
                    sheetName: coachName,
                    details: [sortInfo(acc)],
                  });
                } else {
                  curr[coachIndex].details.push(sortInfo(acc));
                }

                return curr;
              }, []);

              setSortData(sortByCoach);
              setZoneHover(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setZoneHover(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setZoneHover(false);
            }}
          >
            {({ getRootProps, acceptedFile, getRemoveFileProps, Remove }) => (
              <>
                <div
                  {...getRootProps()}
                  style={Object.assign(
                    {},
                    styles.zone,
                    zoneHover && styles.zoneHover
                  )}
                >
                  {acceptedFile ? (
                    <>
                      <div style={styles.file}>
                        <div style={styles.info}>
                          <div style={styles.csvFile}>
                            <img
                              src={filelogo}
                              alt="file"
                              style={styles.filelogo}
                            />
                            <span style={styles.name}>{acceptedFile.name}</span>
                          </div>
                        </div>

                        <div
                          {...getRemoveFileProps()}
                          style={styles.remove}
                          onMouseOver={(event) => {
                            event.preventDefault();
                            setRemoveHoverColor(REMOVE_HOVER_COLOR_LIGHT);
                          }}
                          onMouseOut={(event) => {
                            event.preventDefault();
                            setRemoveHoverColor(DEFAULT_REMOVE_HOVER_COLOR);
                          }}
                        >
                          <div
                            onClick={() => {
                              setSortData([]);
                              setFileIsGenerated(false);
                              setNameFile("");
                            }}
                          >
                            <Remove color={removeHoverColor} />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontWeight: "bold" }}>
                      Dépose le fichier CSV ici ou clique pour le télécharger
                    </p>
                  )}
                </div>
              </>
            )}
          </CSVReader>
          <div>
            <input
              className="inputNameFile"
              onChange={(e) => setNameFile(e.target.value)}
              value={nameFile}
              placeholder="Ajoute un nom à ton fichier"
            />
            <button
              className="downloadButton"
              onClick={() => calculeTotalMonth()}
              disabled={!sortData.length}
            >
              Génerer
            </button>
            <button
              className="downloadButton"
              onClick={() =>
                exportToExcel(sortData, nameFile ? nameFile : "Fichier", true)
              }
              disabled={!fileIsGenerated}
            >
              Télécharger
            </button>
          </div>
        </div>
        <GridPattern
          squares={backgroundArray}
          className={(cn(), "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12")}
        />
      </div>
    </div>
  );
}

export default App;
