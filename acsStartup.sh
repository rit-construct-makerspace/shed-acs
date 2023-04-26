#!/bin/bash
function cleanup(){
	kill $BACK_PID
	kil $FRONT_PID
	echo "children killed"
}

cd /backend
echo "At Backend"

sudo node index.js &
BACK_PID=$!
echo "Start Backend"

sleep 5

cd ../frontend
echo "At Frontend"

#npm run build

echo "Start Frontend"
xdg-open build/index.html
FRONT_PID=$!

trap cleanup SIGTERM

wait $BACK_PID
wait $FRONT_PID

