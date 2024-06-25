import React, { useState } from "react";
import "./App.css";
import { useCSVReader, lightenDarkenColor } from "react-papaparse";
import csvlogo from "./img/csvlogo.png";
import arrow from "./img/arrow.png";
import excellogo from "./img/excellogo.png";

const GREY = "#CCC";
const GREY_LIGHT = "rgba(255, 255, 255, 0.4)";
const DEFAULT_REMOVE_HOVER_COLOR = "#A01919";
const REMOVE_HOVER_COLOR_LIGHT = lightenDarkenColor(
  DEFAULT_REMOVE_HOVER_COLOR,
  40
);
const GREY_DIM = "#686868";

const styles = {
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
  },
  zoneHover: {
    borderColor: { GREY },
  },
  default: {
    borderColor: { GREY_DIM },
  },
  remove: {
    height: 23,
    position: "absolute",
    top: -10,
    width: 23,
  },
  filelogo: {
    height: 80,
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
  inputNameFile: {
    marginTop: "32px",
    boxSizing: "border-box",
    width: "100%",
    padding: "10px",
    fontSize: "16px",
  },
};

const BASE_HORRAIRE = 35;

function App() {
  const { CSVReader } = useCSVReader();
  const [nameFile, setNameFile] = useState("");
  const [zoneHover, setZoneHover] = useState(false);
  const [sortData, setSortData] = useState([]);
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

  function parseDate(str) {
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
  }

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

  return (
    <div className="App">
      <CSVReader
        config={{
          header: true,
        }}
        onUploadAccepted={(results) => {
          const clearData = JSON.parse(
            JSON.stringify(results.data).replace(/[\uFFFD]/g, "é")
          );

          const sortByCoach = clearData.reduce((curr, acc) => {
            if (
              curr.findIndex(
                (coach) => coach.sheetName === acc["Prénom du coach"]
              ) === -1
            ) {
              curr.push({
                sheetName: acc["Prénom du coach"],
                details: [sortInfo(acc)],
              });
            } else {
              curr[
                curr.findIndex(
                  (coach) => coach.sheetName === acc["Prénom du coach"]
                )
              ].details.push(sortInfo(acc));
            }

            return curr;
          }, []);

          sortByCoach.forEach((sorted) => {
            if (sorted.sheetName === undefined) return;
            const total = sorted.details.reduce((a, b) => a + b["Total"], 0);

            sorted.details.push({
              "": "Total :",
              " ": total,
            });
          });

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
                          src={csvlogo}
                          alt="csv files"
                          style={styles.filelogo}
                        />
                        <span style={styles.name}>{acceptedFile.name}</span>
                      </div>
                      <img
                        src={arrow}
                        alt="arrow right"
                        style={styles.arrowLogo}
                      />
                      <img
                        src={excellogo}
                        alt="excel files"
                        style={styles.filelogo}
                      />
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
                      <Remove color={removeHoverColor} />
                    </div>
                  </div>
                </>
              ) : (
                "Dépose le fichier CSV ici ou clique pour le télécharger"
              )}
            </div>
          </>
        )}
      </CSVReader>
      <div>
        <input
          style={styles.inputNameFile}
          onChange={(e) => setNameFile(e.target.value)}
          value={nameFile}
          placeholder="Ajoute un nom à ton fichier"
        />
      </div>
    </div>
  );
}

export default App;
