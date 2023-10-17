import Konva from "konva";
import { createMachine, interpret } from "xstate";


const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiALQAWIgEYAbMr4AmAOwBOPgA49AVn06dAGhCYlavgGYiys8oNrjavXw0bNJwBfINs0LDxCIggAJwBDAHcCKAomfHEwGP4hJBA0MUlpWQUERWMNIn0nHQMjYx1qpz5lW3sEbSI+PgMNGqMnMyc9NWUNELCMHAJiWMTk1NgAYzjkMGzZfIkpGVySxTUnVWVqvjMRg1GNC5s7RE0KvWMntS8jZWMLcbzJyJn4pPwKQAQnFFgBrWDIUFrQQbURbIq7RA6CxEAzecw6NwvBoGVrIvhqIhNMx6MnNYbONRfcJTKKzAEpWiMVgcbjrXKbQo7UAlLEuXSmZzVUneAb40pWCpnDR8PT6dxPPTVGk-abRf7zZnMNicXhqHIiArbYpKAxmdS9Jzo056ZRWFq3SUHNE9DSDYzKF7dAw6VURdUMrX0Zi0ABqTA5RoRPPkiC9fCI7mtgoMTh8ssdbX2Rx6Q1M5mM3XqwS++FQEDgcIDhDhxsRvKUOh8lUMjlGB0J3glinTqkJso0yp0RY8KP9dOIpHIdZjptKmgMrc8zQCTS8ah7V0qV3c7pMjzqE9+GrmgNn3PnPgtGnqvie5UM8olxlcRZ8hisOiH6bGISCQA */
        id: "polyLine",
        initial: "idle",
        states : {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "drawing",
                        actions: ["createLine"],
                    
                    }
                }
            },

            drawing: {
                on: {
                    Enter: {
                        actions: ["saveLine"],
                        target: "idle",
                    },

                    Escape: {
                        actions: ["abandon"],
                        target : "idle"
                    },

                    Backspace: {
                        actions: ["removeLastPoint"],
                        cond: "plusDeDeuxPoints"
                    },

                    MOUSECLICK: [{
                        actions: ["addPoint"],
                        target: "drawing",
                        internal: true,
                        cond: "pasPlein"
                    }, "idle"],

                    MOUSEMOVE: {
                        actions: ["setLastPoint"],
                        target: "drawing",
                        internal: true,
                    }

                },
            },

        }
    },
    // Quelques actions et guardes que vous pouvez utiliser dans votre machine
    {
        actions: {
            // Créer une nouvelle polyline
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                layer.add(polyline);
            },
            // Mettre à jour le dernier point (provisoire) de la polyline
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                layer.batchDraw();
            },
            // Enregistrer la polyline
            saveLine: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                layer.batchDraw();
            },
            // Ajouter un point à la polyline
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
            // Abandonner le tracé de la polyline
            abandon: (context, event) => {
                polyline.remove();
            },
            // Supprimer le dernier point de la polyline
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                layer.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            // On peut encore ajouter un point
            pasPlein: (context, event) => {
                return polyline.points().length < MAX_POINTS * 2;
            },
            // On peut enlever un point
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

// On démarre la machine
const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();
// On envoie les événements à la machine
stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineService.send(event.key);
});
