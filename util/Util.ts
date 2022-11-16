export const getHash = (str: string): number => {
    return 2;
};

/* Assert (n + 2^i) mod (2^m) */
export function fingerMath(input_value, lower_bound, include_lower, upper_bound, include_upper) {
    if (include_lower && include_upper) {
        if (lower_bound > upper_bound) {
            //looping through 0
            return (input_value >= lower_bound || input_value <= upper_bound);
        } else {
            return (input_value >= lower_bound && input_value <= upper_bound);
        }
    } else if (include_lower && !include_upper) {
        if (lower_bound > upper_bound) {
            //looping through 0
            return (input_value >= lower_bound || input_value < upper_bound);
        } else {
            return (input_value >= lower_bound && input_value < upper_bound);
        }
    } else if (!include_lower && include_upper) {
        if (lower_bound > upper_bound) {
            //looping through 0
            return (input_value > lower_bound || input_value <= upper_bound);
        } else {
            // start < end
            return (input_value > lower_bound && input_value <= upper_bound);
        }
    } else {
        //include neither
        if (lower_bound > upper_bound) {
            //looping through 0
            return (input_value > lower_bound || input_value < upper_bound);
        } else {
            // start < end
            return (input_value > lower_bound && input_value < upper_bound);
        }
    }    
}  
