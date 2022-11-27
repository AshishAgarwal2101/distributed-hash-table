import { NodeDetails } from "../local/ChordNode";

export const getHash = (str: string): number => {
    return 2;
};

export const constructNodeStr = (nodeDetails: NodeDetails): string => {
    return `${nodeDetails.id}:${nodeDetails.host}:${nodeDetails.port}`;
}

export const isIdInBetween = (start: number, end: number, middle: number): boolean => {
    if(end > start 
        && (middle > start && middle < end)){
        //e.g. start=2, middle=5, end=22
        return true;
    }
    if(end < start 
        && (middle > start && middle > end)){
        //e.g. start=30, middle=52, end=20
        return true;
    }
    if(end < start 
        && (middle < start && middle < end)){
        //e.g. start=30, middle=12, end=20
        return true;
    }
    
    return false;
};