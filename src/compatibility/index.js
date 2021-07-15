
import {
    zg,
} from '../common';

zg.checkSystemRequirements().then(result => {
    console.log(result);
    document.body.append(JSON.stringify(result));
    // {
    //   webRTC: true,
    //   customCapture: true,
    //   camera: true,
    //   microphone: true,
    //   videoCodec: { H264: true, H265: false, VP8: true, VP9: true },
    //   screenSharing: true,
    //   errInfo: {}
    // }
  });