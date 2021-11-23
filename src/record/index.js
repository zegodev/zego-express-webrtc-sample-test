import {
  checkAnRun,
  supportScreenSharing,
  logout,
  zg,
  loginRoom,
  previewVideo,
} from '../common';
import { getBrowser } from '../assets/utils';

$(async () => {
  await checkAnRun(true);
  console.log('supportScreenSharing', supportScreenSharing);
  if (!supportScreenSharing) {
    $('#screenShot').attr('disabled', 'disabled');
    $('#stopScreenShot').attr('disabled', 'disabled');
  }
  const startRecordButton = $('#startRecord')
  const stopRecordButton = $('#stopRecord')
  const pauseRecordButton = $('#pauseRecord')
  const resumeRecordButton = $('#resumeRecord')
  const saveRecordButton = $('#saveRecord')
  let localStream = null;
  let isPublish = false;
  let isShareScreen = false;
  let isRecording = false;

  const publishStreamID = 'web-' + new Date().getTime();

  const browser = getBrowser();

  console.warn('bro', browser)

  function stopStream () {
    if (isRecording) {
      zg.zegoWebRTC.stopRecord()
      isRecording = false
      stopRecordButton.attr('disabled', 'disabled')
      pauseRecordButton.attr('disabled', 'disabled')
      resumeRecordButton.attr('disabled', 'disabled')
    }
    if (isPublish) {
      zg.stopPublishingStream(publishStreamID)
    }
    if (localStream) {
      zg.destroyStream(localStream)
      localStream = null
    }
    isShareScreen = false
    isPublish = false
  }

  function startPush () {
    const result = zg.startPublishingStream(publishStreamID, previewVideo.srcObject, {videoCodec: $("#videoCodec").val() || "VP8"});
    console.log('publish stream' + publishStreamID, result);
    isPublish = true
    startRecordButton.removeAttr('disabled')
  }

  $('#createStream').on('click', async function () {
    if (!loginRoom) {
      alert('请先登录房间');
      return;
    }
    stopStream()
    localStream = await zg.createStream({
      camera: {
        audioInput: $('#audioList').val(),
        videoInput: $('#videoList').val(),
        video: $('#videoList').val() === '0' ? false : true,
        audio: $('#audioList').val() === '0' ? false : true,
        videoOptimizationMode: $('#videoOptimizationMode').val() ? $('#videoOptimizationMode').val() : "default"
      },
    });
    previewVideo.srcObject = localStream;
    startPush()
  })

  $('#screenShot').on('click', async () => {
    if (!loginRoom) {
      alert('请先登录房间');
      return;
    }
    stopStream()
    try {
      localStream = await zg.createStream({
        screen: {
          //@ts-ignore
          audio: $('#isScreenAudio').val() == 'yes' ? true : false,
          videoQuality: 4,
          bitrate: $('#screenBitRate').val() * 1,
          frameRate: $('#screenFrameRate').val() * 1,
          width: $('#screenWidth').val() * 1 || screen.width,
          height: $('#screenHeight').val() * 1 || screen.height,
          startBitrate: "target",
          videoOptimizationMode: $('#videoOptimizationMode').val() ? $('#videoOptimizationMode').val() : "default"
        },
      });
      previewVideo.srcObject = localStream;
      isShareScreen = true
      startPush()
    } catch (e) {
      console.error('screenShot', e);
    }
  });

  startRecordButton.on('click', function () {
    if (localStream) {
      zg.zegoWebRTC.startRecord(localStream)
      isRecording = true
      startRecordButton.attr('disabled', 'disabled')
      pauseRecordButton.removeAttr('disabled')
      stopRecordButton.removeAttr('disabled')
    }
  })
  pauseRecordButton.on('click', function () {
    resumeRecordButton.removeAttr('disabled')
    pauseRecordButton.attr('disabled', 'disabled')
    zg.zegoWebRTC.pauseRecord()
  })
  resumeRecordButton.on('click', function (){
    resumeRecordButton.attr('disabled', 'disabled')
    pauseRecordButton.removeAttr('disabled')
    zg.zegoWebRTC.resumeRecord()
  })
  stopRecordButton.on('click', function () {
    stopRecordButton.attr('disabled', 'disabled')
    pauseRecordButton.attr('disabled', 'disabled')
    resumeRecordButton.attr('disabled', 'disabled')
    saveRecordButton.removeAttr('disabled')
    startRecordButton.removeAttr('disabled')
    zg.zegoWebRTC.stopRecord()
    isRecording = false
  })
  saveRecordButton.on('click', function () {
    zg.zegoWebRTC.saveRecord('record-file')
  })

  // 点击系统停止共享
  zg.on('screenSharingEnded', (stream) => {
    if (isShareScreen) {
      stopStream()
    }
  });

  $('#stopScreenShot').on('click', () => {
    if (isShareScreen) {
      stopStream()
    }
  });

  $('#leaveRoom').unbind('click').on('click', function () {
    stopStream()
    logout();
  });
});
