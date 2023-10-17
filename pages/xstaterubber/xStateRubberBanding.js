import Konva from "konva";
import { createMachine, interpret } from "xstate";
import { inspect } from "@xstate/inspect";
inspect({
  iframe: () => document.querySelector('iframe[data-xstate]')
});

// L'endroit où on va dessiner
const stage = new Konva.Stage({
  container: "container",
  width: '400',
  height: 400,
});

// Une couche de dessin, il peut y en avoir plusieurs
const layer = new Konva.Layer();
stage.add(layer);

// La ligne en cours de dessin
let rubber;

const rubberBandingMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcCuAjdZkCECGAdhAJYFQB0xEANmAMQCyA8gKoDKAogMIAyAklwDSAbQAMAXUSgADgHtYxAC7FZBKSAAeiAIwBmUeQCsok6IAshgOwBOABy7ttgDQgAnjsuXy1ww4BMogBsttZ+gdbmAL6RLmiY2PhEpBQQyHgA7smMrJzMAGocYpJIIHIKyqrqWgh+trbkgYaBfsaG2j5+urZmLu4I2qJ+5GaWjSMmZhaB2n7RsRhYuIQkZOSpGVnM7Nz8QkXqZUoqaiXVegbGphY29o69iLbaRtExIASyEHDqcYuJK1AHeRHSqnRAAWkC9wQELmIB+CWWyUoNDAgPKxyqiDMfih7V05F0ZkCuj81msekCjUsulh8KWSVW60yZDRwJOoGqDieQUCZjxukClmM1ihAXxoWslNG1l0lhajhekSAA */
    id: "rubberBanding",
    initial: "idle",
    states: {
      idle: {
        on: {
          MOUSECLICK: {
            target: "drawing",
            actions: ["createLine"],
          },
        },
      },

      drawing: {
        on: {
          MOUSEMOVE: {
            actions: ["setLastPoint"],
          }
        },
      }
    },
  },
  {
    actions: {
        // Crée une ligne à la position du clic, les deux points sont confondus
      createLine: (context, event) => {
        const pos = stage.getPointerPosition();
        rubber = new Konva.Line({
          // Les points de la ligne sont stockés comme un tableau de coordonnées x,y
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: "red",
          strokeWidth: 2,
        });
        layer.add(rubber);
      },
      // Modifie le dernier point de la ligne en cours de dessin
      setLastPoint: (context, event) => {
        const pos = stage.getPointerPosition();
        rubber.points([rubber.points()[0], rubber.points()[1], pos.x, pos.y]);
        layer.batchDraw();
      },
      // Sauvegarde la ligne
      saveLine: (context, event) => {
        // Save the line somewhere
      },
    },
  }
);

// On démarre la machine
const rubberBandingService = 
interpret(rubberBandingMachine, { devTools: true })
  .onTransition((state) => {
    console.log("Current state:", state.value);
  })
  .start();

// On transmet les événements souris à la machine
stage.on("click", () => {
  rubberBandingService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
  rubberBandingService.send("MOUSEMOVE");
});