#!/bin/bash

if [[ ! -d ./store ]]; then
  rm -rf ./store
  cp -R ./store-default ./store
fi
