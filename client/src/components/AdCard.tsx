import { Avatar } from "./ui/avatar";
import { Card, CardHeader, CardTitle } from "./ui/card";

export default function AdCard(){
    return(
        <Card>
            <CardHeader>
                <CardTitle>nazvanie</CardTitle>
                <Avatar/>   
            </CardHeader>
        </Card>
    )
}