#!/bin/bash
input="./data_big_list.txt"
while IFS= read -r line
do
  echo "$line"
  unzip -o "$line".zip -d ./
done < "$input"
