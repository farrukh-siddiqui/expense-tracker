import {checkUser} from '@/lib/checkUser';

export default function Navbar() {  
    checkUser();
    return (
        <div>
            Navbar
        </div>
    )
}
