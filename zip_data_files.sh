#!/bin/bash
input="./data_big_list.txt"
while IFS= read -r line
do
  echo "$line"
  zip -9 "$line".zip "$line"
done < "$input"
