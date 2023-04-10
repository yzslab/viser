import styled from "@emotion/styled";
import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { CameraPrimitives, SynchronizedCameraControls } from "./CameraControls";
import React, { MutableRefObject, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import ControlPanel from "./ControlPanel/ControlPanel";
import LabelRenderer from "./LabelRenderer";
import { SceneNodeThreeObject, useSceneTreeState } from "./SceneTree";

import "./index.css";

import Box from "@mui/material/Box";
import {
  FormControlLabel,
  IconButton,
  useMediaQuery,
  Grid,
  Switch,
} from "@mui/material";
import { RemoveCircleRounded, AddCircleRounded } from "@mui/icons-material";
import WebsocketInterface from "./WebsocketInterface";
import { useGuiState } from "./ControlPanel/GuiState";
import {
  getServersFromSearchParams,
  searchParamKey,
  truncateSearchParamServers,
} from "./SearchParamsUtils";

const SingleViewer = React.memo(function SingleViewer(props: {
  panelKey: number;
  globalCameras: MutableRefObject<CameraPrimitives>;
}) {
  // Layout and styles.
  const Wrapper = styled(Box)`
    width: 100%;
    height: 100%;
    position: relative;
  `;

  const Viewport = styled(Canvas)`
    position: relative;
    z-index: 0;

    width: 100%;
    height: 100%;
  `;

  // Our 2D label renderer needs access to the div used for rendering.
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const websocketRef = React.useRef<WebSocket | null>(null);

  // Default server logic.
  function getDefaultServerFromUrl() {
    // https://localhost:8080/ => ws://localhost:8080
    // https://localhost:8080/?server=some_url => ws://localhost:8080
    let server = window.location.href;
    server = server.replace("http://", "ws://");
    server = server.split("?")[0];
    if (server.endsWith("/")) server = server.slice(0, -1);
    return server;
  }
  const servers = new URLSearchParams(window.location.search).getAll(
    searchParamKey
  );
  const initialServer =
    props.panelKey < servers.length
      ? servers[props.panelKey]
      : getDefaultServerFromUrl();

  // Declare the scene tree state. This returns a zustand store/hook, which we
  // can pass to any children that need state access.
  const useSceneTree = useSceneTreeState();
  const useGui = useGuiState(initialServer);

  // TODO: we should consider moving some of these props to a context.
  return (
    <Wrapper ref={wrapperRef}>
      <WebsocketInterface
        panelKey={props.panelKey}
        useSceneTree={useSceneTree}
        useGui={useGui}
        websocketRef={websocketRef}
        wrapperRef={wrapperRef}
      />
      <ControlPanel
        useSceneTree={useSceneTree}
        useGui={useGui}
        websocketRef={websocketRef}
        wrapperRef={wrapperRef}
      />
      <Viewport camera={{ position: [3.0, 3.0, -3.0] }}>
        <LabelRenderer wrapperRef={wrapperRef} />
        <SynchronizedCameraControls
          websocketRef={websocketRef}
          useGui={useGui}
          globalCameras={props.globalCameras}
        />
        <SceneNodeThreeObject name="" useSceneTree={useSceneTree} />
        <Environment preset="city" blur={1} />
      </Viewport>
    </Wrapper>
  );
});

function Root() {
  const globalCameras = useRef<CameraPrimitives>({
    synchronize: false,
    cameras: [],
    cameraControlRefs: [],
  });
  const [panelCount, setPanelCount] = useState(
    Math.max(1, getServersFromSearchParams().length)
  );
  const isPortrait = useMediaQuery("(orientation: portrait)");

  return (
    <Box
      component="div"
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        boxSizing: "border-box",
        paddingBottom: "2.5em",
      }}
    >
      <PanelController
        panelCount={panelCount}
        setPanelCount={setPanelCount}
        globalCameras={globalCameras}
      />
      {Array.from({ length: panelCount }, (_, i) => {
        return (
          <Box
            component="div"
            key={"box-" + i.toString()}
            sx={{
              ...(isPortrait
                ? {
                    width: "100%",
                    height: (100.0 / panelCount).toString() + "%",
                  }
                : {
                    height: "100%",
                    float: "left",
                    width: (100.0 / panelCount).toString() + "%",
                  }),
              boxSizing: "border-box",
              position: "relative",
              "&:not(:last-child)": {
                borderRight: isPortrait ? null : "1px solid",
                borderBottom: isPortrait ? "1px solid" : null,
                borderColor: "divider",
              },
            }}
          >
            <SingleViewer panelKey={i} globalCameras={globalCameras} />
          </Box>
        );
      })}
    </Box>
  );
}

function PanelController(props: {
  panelCount: number;
  setPanelCount: React.Dispatch<React.SetStateAction<number>>;
  globalCameras: MutableRefObject<CameraPrimitives>;
}) {
  return (
    <Box
      component="div"
      sx={{
        position: "fixed",
        bottom: "0",
        width: "100%",
        height: "2.5em",
        zIndex: "1000",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderTop: "1px solid",
        borderTopColor: "divider",
      }}
    >
      <Grid sx={{ float: "right" }}>
        <IconButton
          onClick={() => {
            props.setPanelCount(props.panelCount + 1);
          }}
        >
          <AddCircleRounded />
        </IconButton>
        <IconButton
          disabled={props.panelCount === 1}
          onClick={() => {
            if (props.panelCount === 1) return;
            truncateSearchParamServers(props.panelCount - 1);
            props.setPanelCount(props.panelCount - 1);
          }}
        >
          <RemoveCircleRounded />
        </IconButton>
        <FormControlLabel
          control={<Switch />}
          label="Sync Cameras"
          defaultChecked={props.globalCameras.current.synchronize}
          onChange={(_event, checked) => {
            props.globalCameras.current.synchronize = checked;
          }}
          sx={{ pl: 1 }}
          disabled={props.panelCount === 1}
        />
      </Grid>
    </Box>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<Root />);