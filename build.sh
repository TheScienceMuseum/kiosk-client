#!/usr/bin/env bash

S3_BUCKET="joipolloi-scimus-builds"
AWS_PROFILE="scimus"

echo "Building for OSX"
echo
echo "You must have aws cli tools, yarn, and node installed"
echo
yarn install
yarn dist:staging:mac
cd dist
ARCHIVE_NAME=`echo *.pkg | sed "s/.pkg/.zip/"`
zip ${ARCHIVE_NAME} *.pkg
cd ..
aws s3 cp dist/${ARCHIVE_NAME} s3://${S3_BUCKET}/ --profile ${AWS_PROFILE}
