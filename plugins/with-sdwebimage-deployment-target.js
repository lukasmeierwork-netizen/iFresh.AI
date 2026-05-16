const { withPodfile, createRunOncePlugin } = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");

const PLUGIN_NAME = "with-sdwebimage-deployment-target";
const IOS_DEPLOYMENT_TARGET = "15.1";
const POST_INSTALL_ANCHOR = /^\s+post_install do \|installer\|$/;
const POD_TARGETS = [
  "SDWebImage",
  "SDWebImage-SDWebImage",
  "SDWebImageAVIFCoder",
  "SDWebImageSVGCoder",
  "SDWebImageWebPCoder",
];

function addHelperMethod(src) {
  const podTargets = POD_TARGETS.map((target) => `'${target}'`).join(", ");
  return mergeContents({
    src,
    newSrc: [
      "def set_sdwebimage_deployment_target(installer)",
      `  pod_targets = [${podTargets}]`,
      "  installer.pods_project.targets.each do |target|",
      "    next unless pod_targets.include?(target.name)",
      "",
      "    target.build_configurations.each do |config|",
      `      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${IOS_DEPLOYMENT_TARGET}'`,
      "    end",
      "  end",
      "end",
      "",
    ].join("\n"),
    tag: PLUGIN_NAME,
    anchor: POST_INSTALL_ANCHOR,
    offset: 0,
    comment: "#",
  }).contents;
}

function addPostInstallCall(src) {
  return mergeContents({
    src,
    newSrc: "  set_sdwebimage_deployment_target(installer)",
    tag: `${PLUGIN_NAME}-call`,
    anchor: POST_INSTALL_ANCHOR,
    offset: 1,
    comment: "#",
  }).contents;
}

const withSdwebimageDeploymentTarget = (config) =>
  withPodfile(config, (config) => {
    config.modResults.contents = addPostInstallCall(
      addHelperMethod(config.modResults.contents),
    );
    return config;
  });

module.exports = createRunOncePlugin(
  withSdwebimageDeploymentTarget,
  PLUGIN_NAME,
  "1.0.0",
);
