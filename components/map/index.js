import { Component } from "react";
import ReactMapGL from "react-map-gl";

class Map extends Component {
  state = {
    viewport: {
      width: "100vw",
      height: "100vh",
      latitude: 41.5868,
      longitude: -93.625,
      zoom: 13,
    },
  };

  render() {
    return (
      <ReactMapGL
        mapStyle="mapbox://styles/tappertj/cke2apv7o0lh919jnd70w86gj"
        mapboxApiAccessToken="pk.eyJ1IjoidGFwcGVydGoiLCJhIjoiY2tlMmFubGxlMDdqYTMxc3oxc3JnbmVnNSJ9.KpvWinROg5s5ClZBksdWhA"
        onViewportChange={(viewport) => this.setState({ viewport })}
        {...this.state.viewport}
      />
    );
  }
}

export default Map;
