#!/bin/bash

if [[ $1 != '--keep' || ! -d ./store ]]; then
  rm -rf ./store
  cp -R ./store-default ./store
fi
