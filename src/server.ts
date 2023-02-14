import express from "express";
import cors from "cors"
import { PrismaClient } from "@prisma/client";
import { convertHourToStringMinutes } from "./utils/convert-hour-string-to-minutes";
import { convertMinutesToHourString } from "./utils/convert-minutes-to-hour-string";

const app = express();
const prisma =  new PrismaClient({
    log: ['query']
})

app.use(express.json())
app.use(cors())

app.get("/games", async (req, res) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true
                }
            }
        }
    })

    return res.json(games)
})

app.post("/games/:id/ads", async (req, res) => {
    const { id } = req.params
    const body = req.body

    const ad = await prisma.ad.create({
        data: {
            gameId: id,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(","),
            hourStart: convertHourToStringMinutes(body.hourStart),
            hourEnd: convertHourToStringMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    })

    return res.status(201).json(ad)
})

app.get("/games/:id/ads", async (req, res) => {
    const { id } = req.params

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            yearsPlaying: true,
            weekDays: true,
            hourStart: true,
            hourEnd: true,
            useVoiceChannel: true
        },
        where: {
            gameId: id
        },
        orderBy: {
            createdAt: "desc"
        }
    })

    return res.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(","),
            hourStart: convertMinutesToHourString(ad.hourStart),
            hourEnd: convertMinutesToHourString(ad.hourEnd)
        }
    }))
})

app.get("/ads/:id/discord", async (req, res) => {
    const { id } = req.params

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where: {
            id: id
        }
    })

    return res.json({
        discord: ad.discord
    })
})

app.listen(1111)