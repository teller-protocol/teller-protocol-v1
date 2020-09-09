#!/bin/bash
if [ $# -lt 4 ]
  then
    echo "Missing arguments. Execute: ./scripts/sh/steps/update_platform_settings.sh network sender_index settings_name new_value"
    echo ""
    echo "Example: ./scripts/sh/steps/update_platform_settings.sh network sender_index settings_name new_value"
    echo "      It will reset to 0 the SafetyInterval configuration."
    exit -1
fi

network=$1
sender_index=$2
settings_name=$3
new_value=$4

echo "\n------------------------------------------------------------------------"
echo "#4: Updating platform settings..."
echo "------------------------------------------------------------------------\n"

truffle exec ./scripts/settings/updatePlatformSetting.js \
    --network $network \
    --senderIndex $sender_index \
    --settingName $settings_name \
    --newValue $new_value
if [ \( $? -lt 0 \) -o \( $? -gt 0 \) ]
then
  echo "Process finished with errors."
  exit -1
fi