##!/bin/bash
echo "Deploying HealthCart tokens"

cd ../backend
rm -rf deployments && yarn build && yarn deploy

ERC_721=$(jq '.address' ./deployments/localhost/HCRTBADGE.json | \
    sed "s/[\",]//g")

ERC_20=$(jq '.address' ./deployments/localhost/HCRT.json | \
    sed "s/[\",]//g")

echo $ERC_20 $ERC_721


holder_address="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

i=1
while [[ $i -le 5 ]] ; do
    echo "$i"
    (( i += 1 ))
    echo "minting token ..."
    npx hardhat mint-token \
        --recipient 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \
        --erc721 $ERC_721 \
        --network localhost
done

sleep 5

cd ../../../rollups-examples/frontend-console

yarn start erc20 deposit --amount 100000000000000000000 --erc20 $ERC_20

sleep 5

for i in {1..5}
do 
    echo $i
    yarn start erc721 deposit --tokenId $i --erc721 $ERC_721
    sleep 5
done

yarn start input send --payload '{"action":"create_tables"}'

sleep 5

#echo "{\"action\":\"initialize_assets\",\"data\":{\"holder_add\":\"$holder_add\",\"hcrt_add\":\"$ERC_20\",\"hcrt_badge_add\":\"$ERC_721\"}}"
Json_string='{"action":"initialize_assets","data":{"holder_add":"'$holder_address'","hcrt_add":"'$ERC_20'","hcrt_badge_add":"'$ERC_721'"}}'
echo $Json_string

yarn start input send --payload "$Json_string"

yarn start input send --payload '{"action":"user","data":{"firstname":"jj","lastname":"hbk","address":"0xaskdfhkdsjkfhjksafd","height":180,"weight":80,"total_rewards":0,"timestamp":"151212"}}'

echo yarn start input send --payload '{"action":"activity","data":{"userId":1399997774,"steps":1000,"reward":0,"timestamp":"1243324"}}'

echo "enter user data"
read add_user_data

$add_user_data



