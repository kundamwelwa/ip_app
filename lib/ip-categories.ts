
export type IPCategory =
    | 'Rajant Networks'
    | 'Modular IPs'
    | 'Switches'
    | 'Repeaters / Router'
    | 'DSS (Driver safety System)'
    | 'Tyre sence'
    | 'Split Camera'
    | 'Other';

export const getIPCategory = (ipAddress: string): IPCategory => {
    if (!ipAddress) return 'Other';

    const parts = ipAddress.split('.');
    if (parts.length !== 4) return 'Other';

    const thirdOctet = parseInt(parts[2], 10);

    switch (thirdOctet) {
        case 140:
            return 'Rajant Networks';
        case 141:
            return 'Modular IPs';
        case 142:
            return 'Switches';
        case 143:
            return 'Repeaters / Router';
        case 144:
            return 'DSS (Driver safety System)';
        case 145:
            return 'Tyre sence';
        case 149:
            return 'Split Camera';
        default:
            return 'Other';
    }
};

export const CATEGORY_ORDER: IPCategory[] = [
    'Rajant Networks',
    'Modular IPs',
    'Switches',
    'Repeaters / Router',
    'DSS (Driver safety System)',
    'Tyre sence',
    'Split Camera',
    'Other'
];
