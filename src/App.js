import React, { useState } from "react";
import "./App.css";
import { useCSVReader, lightenDarkenColor } from "react-papaparse";

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
    background: "#C2C2C2",
    borderRadius: 20,
    display: "flex",
    height: 150,
    width: 150,
    position: "relative",
    zIndex: 10,
    flexDirection: "column",
    justifyContent: "center",
  },
  info: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    paddingLeft: 10,
    paddingRight: 10,
  },
  name: {
    backgroundColor: GREY_LIGHT,
    borderRadius: 3,
    fontSize: 12,
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
    right: 6,
    top: 6,
    width: 23,
  },
};

const BASE_HORRAIRE = 35;

function App() {
  const { CSVReader } = useCSVReader();
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
                      <span style={styles.name}>{acceptedFile.name}</span>
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
                "Drop CSV file here or click to upload"
              )}
            </div>
          </>
        )}
      </CSVReader>
    </div>
  );
}

export default App;
