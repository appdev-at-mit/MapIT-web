import React, { useEffect, useState } from "react";
import axios from 'axios';

const Classes = ({ onSectionSelect }) => {
    const [haveSearched, setHaveSearched] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [subjectID, setSubjectID] = useState(null);
    const [room, setRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        setIsLoading(true);
    }, [subjectID]);

    useEffect(() => {
        if (!subjectID){
            return;
        }

        axios.get(`/api/class`, {params: {subjectId: subjectID}})
        .then((res) => {
            setIsLoading(false);
            const schedule = res.data.schedule;
            parseSchdule(schedule);
        }).catch((e) => {
            setIsLoading(false);
            setSchedules(undefined);
            console.log(e);
            console.log(`NOT FOUND for ${subjectID}`);
        });
    }, [isLoading]);

    useEffect(() => {
        if (room === null || room === undefined) {
            return;
        }

        const searchQuery = `${room.building}-${room.roomNumber}`;

        axios.get(`/api/rooms/search/${encodeURIComponent(searchQuery)}`)
        .then((result) => {
            onSectionSelect(result.data);
        })
        .catch((e) => {
            console.error('Search failed');
        });

    }, [room]);

    function parseSchdule(scheduleStr) {
        const blocks = scheduleStr.split(';');
        const timeBlockRe = /(?<room>[\w-]+)\/(?<days>[\w-]+)\/(?<timeType>\d)\/(?<time>[\w-]+)/;
        const roomRe = /(?<building>\d+)-(?<room>\d+)/;

        const newSchedules = []

        blocks.forEach((block) => {
            const allTime = block.split(',');
            const sectionType = allTime[0];
            for (const timeBlock of allTime.slice(1)) {
                const schedule = timeBlockRe.exec(timeBlock).groups;
                const building = roomRe.exec(schedule.room).groups.building;
                const roomNumber = roomRe.exec(schedule.room).groups.room;
                
                newSchedules.push({
                    type: sectionType, 
                    building: building,
                    roomNumber: roomNumber, 
                    days: schedule.days,
                    time: schedule.time,
                });
            }
        })

        setSchedules(newSchedules);
    }

    function displaySchedule() {
        if (!haveSearched){
            return '';
        }

        const style = "text-base pt-2 pb-2"
        const header = <p className={style}>Subject Found: {subjectID}</p>

        if (isLoading) {
            return <div className={style}>
            { 'Loading...' }
        </div>;
        }
        if (schedules === undefined) {
            return <div className={style}>
                { 'Cannot find class' }
            </div>;
        } else if (schedules.length === 0) {
            return <div>
                {header}
                { 'No Classes this semester' }
            </div>;
        } else if (schedules.length > 0) {
            const list = schedules.map((sectionInfo) => {
                let bgColor = 'bg-gray-100';
                switch(sectionInfo.type) {
                    case "Lecture":
                        bgColor = 'bg-green-200';
                        break;
                    case "Recitation":
                        bgColor = 'bg-blue-200';
                        break;
                    case "Lab":
                        bgColor = 'bg-purple-200';
                        break;
                    case "Design":
                        bgColor = 'bg-pink-200';
                        break;
                }
                return (
                        <li className="border rounded mt-2 mb-2">
                            <button onClick={() => setRoom(sectionInfo)} className="text-left w-full">
                                <div className={`font-bold ${bgColor} pl-2`}>{sectionInfo.type}</div>
                                <p className="p-1">
                                    {sectionInfo.building ? `${sectionInfo.building} - ` : ""} {sectionInfo.roomNumber}
                                <br />
                                Meets every {sectionInfo.days} at {sectionInfo.time}<br />
                                </p>
                            </button>
                        </li>
                    );
                }
            );
            return <ul>{list}</ul>
        } else {
            console.error('Something went wrong.');
            return <div className={style}>
                { '' }
            </div>;
        } 
    }

    function handleSubjectIDQuery (e) {
        // Prevent URL from changing
        // https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form
        e.preventDefault(); 
        setHaveSearched(true);
        const form = e.target;
        const formData = new FormData(form);
        setSubjectID(formData.get('subjectId'));
    }

    return <div>
        <p className="text-base flex">
            <form onSubmit = {handleSubjectIDQuery} className="w-full">
                <input type= "text" name="subjectId" className="p-2 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                <button type="submit" className="h-full border rounded"> Search </button>
            </form>
        </p>
        <div className="overflow-scroll">
            { displaySchedule() }
       </div>
    </div>;
};

export default Classes;