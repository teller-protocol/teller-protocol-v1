#!/bin/bash

echo
echo "  Installing repository dependencies...."
echo

yarn install

echo
echo "  Setting up environment variables file (.env)"

cp .env.template .env

echo "   - Open \`.env\` in your editor and make sure you have all the necessary variables set"
echo
